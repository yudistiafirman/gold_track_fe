# Penutupan Saldo Harian & Rekonsiliasi (Daily Closing)

> Belum ada nomor tiket resmi (FE-XXXX) — sesuaikan dengan penomoran di tracker internal saat
> diimport. Backend sudah selesai, sudah dites (e2e), dan migration-nya sudah live di database.

## Latar belakang

Client (owner toko) komplain: **"pendapatan dan pengeluaran hari ini itu nggak sinkron sama hasil
akhir kemarin"**. Selama ini mereka cek ini manual di Excel — satu sheet per hari, dengan rumus
yang bandingin kenaikan "Total Saldo" (kas + nilai emas) dari sheet kemarin ke sheet hari ini,
terus dicocokkan sama keuntungan (pendapatan − pengeluaran) hari itu. Kalau ada selisih, berarti
ada uang masuk/keluar yang nggak ke-track lewat pembukuan formal.

Backend sekarang punya fitur baru buat ngelakuin pengecekan yang sama:

1. **`/api/daily-closings`** — admin "nutup buku" tiap hari (aksi manual, mirip cara owner ngisi
   satu sheet Excel per hari), yang nyimpen snapshot saldo (`total_balance` + `total_gold_value`)
   sebagai baseline permanen.
2. **`/api/reports/reconciliation`** — bandingin saldo hidup **sekarang** vs baseline penutupan
   terakhir + laba yang sudah dibukukan sejak itu, dan kasih tau kalau ada selisih (`in_sync:
   false`) — persis simptom yang dilaporkan client.

Dua fitur ini **saling terkait tapi terpisah**: `/api/daily-closings` adalah aksi "nyatet",
`/api/reports/reconciliation` adalah laporan "baca" yang otomatis pakai closing terakhir yang
tercatat. Tidak ada closing sama sekali → reconciliation cuma bisa bilang "belum ada baseline",
tidak bisa membandingkan apa-apa.

## Scope

**In scope:**
- Halaman baru **"Tutup Buku"** (`/daily-closings`) — riwayat penutupan (tabel, terbaru duluan,
  dipaginasi) + tombol "Tutup Hari Ini" (confirm dialog, aksi `POST` tanpa form sama sekali).
- Halaman baru **"Rekonsiliasi"** (`/reports/reconciliation`) — angka pembanding saldo aktual vs
  saldo yang diharapkan, plus status "Sinkron"/"Tidak Sinkron".
- Nav menu + role guard buat kedua halaman baru itu.
- Badge tone baru buat status sinkron/tidak sinkron (lihat bagian "Domain status mappings").

**Out of scope (sengaja tidak ada, by design — jangan ditambahin di FE juga):**
- Tidak ada edit/delete/"buka lagi" buat `daily_closings` — penutupan itu catatan historis
  permanen (mirip `gold_prices`), sama sekali tidak bisa diubah/dihapus dari FE.
- Tidak ada cron/auto-close di FE — nutup buku selalu aksi manual satu tombol, tidak ada toggle
  "otomatis tutup tiap jam X".
- Tidak ada filter tanggal di halaman Rekonsiliasi — endpoint-nya tanpa query param sama sekali,
  selalu "saldo sekarang vs penutupan terakhir". Jangan tambahin date picker.
- Tidak ada endpoint buat "tutup hari tertentu di masa lalu" — `POST /api/daily-closings` selalu
  menutup hari **ini** (tanggal UTC saat request dikirim), tidak ada parameter tanggal.
- Tidak perlu digabung ke halaman Dashboard yang sudah ada — dua halaman baru ini berdiri sendiri,
  cukup ditaut lewat nav menu (beda dari `cash_summary` yang memang menumpang di dashboard).

## Role & akses

**SUPER_ADMIN only** — sama seperti `/reports/*`, `/balance-accounts`, `/users`. `ADMIN` dan
`KASIR` sama sekali tidak boleh akses (backend balikin `403`). Gating pakai `SUPER_ADMIN_ROLES`
dari `src/config/nav.ts`, sama pola dengan route `dashboard`/`reports/finance`/dll yang sudah ada.

---

## Dokumentasi API

Base URL & auth mengikuti konvensi yang sudah ada (`src/lib/api/client.ts` — Bearer token
otomatis, envelope `{success, data}` otomatis ke-unwrap jadi `T`, error jadi `ApiError`).

### `POST/GET /api/daily-closings` — riwayat penutupan

```
POST /api/daily-closings              (tanpa body)                -> 201 / 403 / 409
GET  /api/daily-closings              ?page=&limit=                -> 200
GET  /api/daily-closings/{id}                                      -> 200 / 404
```

Response tiap item (`POST` 201, dan tiap elemen `items[]` di `GET` list, dan `GET` by id):
```json
{
  "id": "6c7d8e9f-0123-4567-89ab-cdef01234567",
  "closing_date": "2026-08-31",
  "total_balance": 8500000,
  "total_gold_value": 149000000,
  "total_saldo": 157500000,
  "created_at": "2026-08-31T23:59:00Z"
}
```
- `closing_date` — tanggal (UTC) yang ditutup, format `YYYY-MM-DD`. Selalu "hari ini" saat `POST`
  dikirim — **tidak bisa** dipilih/diisi dari client.
- `total_balance` — snapshot `cash_summary.total_balance` (saldo `balance_accounts`) **saat itu**.
- `total_gold_value` — snapshot `cash_summary.total_gold_value` (nilai stok emas `AVAILABLE`)
  **saat itu**.
- `total_saldo = total_balance + total_gold_value` — sudah dihitung backend, jangan dihitung ulang
  di FE (biar tidak ada kemungkinan beda pembulatan).
- Ketiga angka ini **snapshot beku** — kalaupun `balance_accounts`/stok berubah setelahnya, baris
  `daily_closings` ini tidak ikut berubah (itu justru intinya, sebagai baseline historis).

`GET` list respons envelope pakai bentuk pagination standar app ini:
```json
{
  "items": [ { "...": "seperti di atas" } ],
  "pagination": { "page": 1, "limit": 20, "total": 12, "total_pages": 1 }
}
```
Urut `closing_date` terbaru duluan.

Error cases:
```json
// 409 — hari ini sudah pernah ditutup (cuma boleh 1x per hari)
{"success":false,"error":{"code":"CONFLICT","message":"hari ini sudah ditutup"}}

// 403 — role selain SUPER_ADMIN
{"success":false,"error":{"code":"FORBIDDEN","message":"Anda tidak memiliki akses untuk aksi ini"}}

// 404 — GET by id, tidak ditemukan / format id salah
{"success":false,"error":{"code":"NOT_FOUND","message":"penutupan harian tidak ditemukan"}}
```

### `GET /api/reports/reconciliation` — cek sinkron atau tidak

```
GET /api/reports/reconciliation   (tanpa query param)   -> 200 / 403
```

Response kalau **sudah pernah** ada penutupan sebelum hari ini:
```json
{
  "success": true,
  "data": {
    "has_baseline": true,
    "last_closing_date": "2026-08-30",
    "period_from": "2026-08-31",
    "period_to": "2026-08-31",
    "last_closing_saldo": 157500000,
    "period_revenue": 1500000,
    "period_cogs": 1000000,
    "period_expenses": 0,
    "period_net_profit": 500000,
    "actual_total_balance": 8500000,
    "actual_total_gold_value": 149000000,
    "actual_saldo": 157500000,
    "expected_saldo": 158000000,
    "difference": -500000,
    "in_sync": false
  }
}
```
Response kalau **belum pernah** ada penutupan sama sekali:
```json
{
  "success": true,
  "data": {
    "has_baseline": false,
    "actual_total_balance": 8500000,
    "actual_total_gold_value": 149000000,
    "actual_saldo": 157500000,
    "in_sync": false
  }
}
```

Penjelasan field (penting buat bikin UI-nya masuk akal, bukan cuma nampilin angka mentah):

- **`has_baseline: false`** → semua field selain `actual_*`/`in_sync` **tidak ada di response sama
  sekali** (bukan `null`, betul-betul absent — pakai optional chaining/default value di FE).
  Tampilkan empty state "Belum pernah tutup buku" + CTA ke halaman Tutup Buku, **jangan** render
  kartu perbandingan dengan angka kosong/nol yang menyesatkan.
- `last_closing_date` — tanggal penutupan **terakhir sebelum hari ini** (bukan berarti "kemarin"
  secara harfiah — kalau ada beberapa hari yang kelewat tanpa ditutup, ini bisa beberapa hari lalu,
  persis sheet Excel client yang kadang bolong).
- `period_from`/`period_to` — rentang tanggal yang laba-nya (`period_net_profit`) diakumulasi:
  sehari setelah `last_closing_date` sampai hari ini. Bisa lebih dari 1 hari kalau ada gap.
- `expected_saldo = last_closing_saldo + period_net_profit` — prediksi saldo hari ini **seandainya**
  semua transaksi/pengeluaran di periode itu benar sudah kecatat sebagai perubahan
  `total_balance`/`total_gold_value` (mis. hasil jual sudah di-`PUT` ke `balance_accounts`).
- `actual_saldo = actual_total_balance + actual_total_gold_value` — kondisi **sekarang beneran**.
- `difference = actual_saldo - expected_saldo`. **Negatif** artinya saldo aktual lebih kecil dari
  yang diharapkan (kemungkinan besar: ada penjualan yang hasilnya belum di-input ke saldo uang —
  ini persis kasus yang dilaporkan client). **Positif** artinya ada saldo lebih dari yang
  diharapkan (mis. setoran yang tidak match transaksi manapun).
- `in_sync` — `true` kalau `difference` (mendekati) nol. Kalau `false`, tampilkan `difference`
  dengan jelas (warna merah/hijau, format Rupiah, tanda `+`/`-` eksplisit) — ini angka paling
  penting di halaman ini, jangan disembunyikan di balik toggle/detail.

Error cases:
```json
// 403 — role selain SUPER_ADMIN
{"success":false,"error":{"code":"FORBIDDEN","message":"Anda tidak memiliki akses untuk aksi ini"}}
```

---

## Rencana implementasi FE

### 1. Types — `src/types/`
- `daily-closing.ts`:
  ```ts
  export interface DailyClosing {
    id: string
    closing_date: string
    total_balance: number
    total_gold_value: number
    total_saldo: number
    created_at: string
  }
  ```
- `reconciliation-report.ts`:
  ```ts
  export interface ReconciliationReport {
    has_baseline: boolean
    last_closing_date?: string
    period_from?: string
    period_to?: string
    last_closing_saldo?: number
    period_revenue?: number
    period_cogs?: number
    period_expenses?: number
    period_net_profit?: number
    actual_total_balance: number
    actual_total_gold_value: number
    actual_saldo: number
    expected_saldo?: number
    difference?: number
    in_sync: boolean
  }
  ```
  Field opsional itu memang absent saat `has_baseline: false` (lihat dokumentasi API di atas) —
  jangan dijadikan wajib/non-optional di type-nya.

### 2. Hooks — `src/hooks/`
- `use-reconciliation-report.ts` — `useQuery({ queryKey: ['reports', 'reconciliation'], queryFn:
  () => api.get<ReconciliationReport>('/reports/reconciliation') })`. Tanpa param sama sekali
  (beda dari `use-dashboard`/`finance-report` yang punya `from`/`to`).
- List `daily-closings` dipaginasi (`?page=&limit=`) — ikuti pola inline `useQuery` di
  `expenses-page.tsx` (bukan hook terpisah, karena butuh `page` state dari komponen) daripada pola
  `use-balance-accounts.ts` (list flat tanpa pagination, tidak cocok di sini).

### 3. Komponen — `src/components/daily-closings/`
- `close-daily-balance-dialog.tsx` — niru struktur `cancel-purchase-order-dialog.tsx` 1:1 (dialog
  konfirmasi + `useMutation` tanpa form, tanpa body request):
  ```ts
  const closeMutation = useMutation({
    mutationFn: () => api.post<DailyClosing>('/daily-closings'),
    onSuccess: (closing) => {
      queryClient.invalidateQueries({ queryKey: ['daily-closings'] })
      queryClient.invalidateQueries({ queryKey: ['reports', 'reconciliation'] })
      showSuccessToast(`Buku tanggal ${closing.closing_date} berhasil ditutup.`)
      handleClose()
    },
  })
  ```
  Error `409` ("hari ini sudah ditutup") harus tampil jelas di dialog (pola sama seperti
  `errorMessage` di `cancel-purchase-order-dialog.tsx`) — bukan cuma toast yang lewat, karena user
  kemungkinan besar mencet tombol ini lagi tanpa sadar sudah ditutup.

### 4. Halaman — `src/pages/`

**`daily-closings-page.tsx`** — niru `expenses-page.tsx` (DataTable dipaginasi + tombol aksi):
- Kolom: Tanggal Ditutup (`formatDate(row.closing_date)`), Saldo Uang (`formatCurrency`), Nilai
  Emas (`formatCurrency`), Total Saldo (`formatCurrency`, bold/emphasized — ini angka paling
  penting di baris), Ditutup Pada (`formatDate(row.created_at)`, jam-nya juga kalau format helper
  yang ada mendukung).
- Tombol "Tutup Hari Ini" di kanan atas filter bar (pola sama `Button` + `Plus`/icon lain yang
  relevan dari `lucide-react`, mis. `Lock`/`CalendarCheck`), buka `CloseDailyBalanceDialog`.
- Tidak ada kolom Aksi/row menu — tidak ada aksi apa pun per baris (immutable, lihat scope).

**`reconciliation-report-page.tsx`** — niru struktur `finance-report-page.tsx` tapi **tanpa** filter
tanggal (lihat scope) dan tanpa tombol export:
- State `has_baseline: false` → `EmptyState` (pola sama seperti `isEmpty` di
  `finance-report-page.tsx`), judul "Belum Ada Penutupan", deskripsi ajak user ke halaman Tutup
  Buku dulu, tombol aksi `<Link to="/daily-closings">`.
- State `has_baseline: true`:
  - Badge besar di atas: `StatusBadge` dengan tone dari mapping baru (lihat poin 5) + label
    "Sinkron" / "Tidak Sinkron", ditaruh menonjol (bukan cuma di tabel kecil) — ini jawaban utama
    dari pertanyaan client.
  - Beberapa `KpiCard` (pola sama `finance-report-page.tsx`/`dashboard-page.tsx`):
    - "Saldo Penutupan Terakhir" (`last_closing_saldo`, caption tanggal `last_closing_date`)
    - "Laba Periode Berjalan" (`period_net_profit`, caption rentang `period_from`–`period_to`)
    - "Saldo Diharapkan" (`expected_saldo`)
    - "Saldo Aktual" (`actual_saldo`)
    - "Selisih" (`difference`, `tone="negative"` kalau `difference !== 0`, tampilkan tanda
      `+`/`-` eksplisit — **jangan** cuma `formatCurrency(Math.abs(...))` yang menghilangkan
      arah selisihnya)
  - Section kecil breakdown `period_revenue`/`period_cogs`/`period_expenses` (opsional tapi
    membantu audit — tabel 3 baris sederhana, tidak perlu chart).

### 5. Routing — `src/app/router.tsx`
Tambah 2 route baru di dalam blok `RoleGuard roles={SUPER_ADMIN_ROLES}` yang sudah ada (grup sama
`dashboard`/`reports/*`/`balance-accounts`):
```tsx
{ path: 'daily-closings', element: <DailyClosingsPage /> },
{ path: 'reports/reconciliation', element: <ReconciliationReportPage /> },
```

### 6. Nav menu — `src/config/nav.ts`
- Tambah `{ title: 'Rekonsiliasi', url: '/reports/reconciliation' }` ke `children` group "Laporan"
  yang sudah ada (sejajar dengan Transaksi/Stok/Keuangan).
- Tambah `{ title: 'Tutup Buku', url: '/daily-closings' }` ke `children` group "Kas" yang sudah ada
  (sejajar dengan Saldo Uang/Uang Diluar/Hutang Diluar) — penutupan saldo adalah bagian dari alur
  tracking kas yang sama, bukan laporan periode seperti grup "Laporan".

### 7. Domain status mapping — `src/lib/domain-status.ts`
Tambah tone map baru buat status sinkron/tidak sinkron:
```ts
export const RECONCILIATION_TONE = {
  true: 'success',
  false: 'error',
} as const satisfies Record<string, StatusTone>
```
Dipakai di `reconciliation-report-page.tsx`:
```tsx
<StatusBadge
  tone={RECONCILIATION_TONE[String(report.in_sync) as 'true' | 'false']}
  label={report.in_sync ? 'Sinkron' : 'Tidak Sinkron'}
/>
```
(atau langsung inline ternary tone `'success' : 'error'` kalau dirasa berlebihan bikin map baru
cuma buat 2 nilai boolean — keduanya valid, ikuti gaya file `domain-status.ts` yang sudah ada saat
implementasi.)

---

## Acceptance Criteria

- [ ] Non-SUPER_ADMIN (ADMIN/KASIR) tidak bisa akses `/daily-closings` maupun
      `/reports/reconciliation` (redirect ke `/403`), dan kedua menu-nya tidak muncul di sidebar.
- [ ] Tombol "Tutup Hari Ini" berhasil membuat penutupan baru (201), riwayat ter-refresh otomatis
      (invalidate query), dan halaman Rekonsiliasi ikut ter-refresh (baseline berubah).
- [ ] Menutup buku dua kali di hari yang sama menampilkan error `409` ("hari ini sudah ditutup")
      dengan jelas di dialog, bukan cuma toast yang lewat cepat.
- [ ] Riwayat penutupan tampil dipaginasi, terbaru duluan, tidak ada kolom/aksi edit/hapus di
      mana pun (termasuk tidak ada di row actions menu).
- [ ] Halaman Rekonsiliasi state "belum ada baseline" (`has_baseline: false`) menampilkan empty
      state yang mengarahkan user ke halaman Tutup Buku — **tidak** menampilkan kartu KPI dengan
      angka kosong/nol yang menyesatkan.
- [ ] Halaman Rekonsiliasi state "ada baseline" menampilkan badge Sinkron/Tidak Sinkron yang
      benar sesuai `in_sync`, dan `difference` ditampilkan dengan arah (+/-) yang jelas, bukan
      nilai absolut.
- [ ] Tidak ada date picker/filter tanggal di halaman Rekonsiliasi, dan tidak ada
      edit/delete/"buka lagi" di mana pun untuk resource `daily_closings` (sesuai desain backend
      yang sengaja immutable).
