# Tracking Kas Manual — Saldo Uang, Uang Diluar, Hutang Diluar

> Belum ada nomor tiket resmi (FE-XXXX) — sesuaikan dengan penomoran di tracker internal saat
> diimport. Backend sudah selesai dan sudah live di API (lihat dokumentasi lengkap di bawah).

## Latar belakang

Owner toko minta cara untuk mencatat manual "di mana saja uang toko berada", di luar data
transaksi/stok yang sudah otomatis kehitung sistem:

1. **Saldo Uang** — saldo per rekening bank/cash (BCA Bisnis, BCA Prio, Mandiri Bisnis, Cash, dst).
2. **Uang Diluar** — uang yang lagi di lapangan/belum settle (mis. buyback yang belum dibayar
   tunai), dicatat nominalnya (bukan gramasi — gramasi cukup jadi teks keterangan).
3. **Hutang Diluar** — piutang, orang-orang yang pinjam uang dari toko.

Ketiganya digabung jadi satu ringkasan di dashboard (`cash_summary`): total nilai stok emas + total
saldo + total uang diluar + total hutang diluar.

## Scope

**In scope:**
- 3 halaman CRUD baru: Saldo Uang, Uang Diluar, Hutang Diluar (list + create/edit/delete dialog).
- Tambahan section "Ringkasan Kas" di halaman Dashboard yang sudah ada, pakai data `cash_summary`
  yang sudah nempel di response `GET /api/reports/dashboard` (tidak perlu request tambahan).
- Nav menu + role guard buat 3 halaman baru itu.

**Out of scope (sengaja tidak ada, by design — jangan ditambahin di FE juga):**
- Tidak ada riwayat/history perubahan saldo atau log pembayaran cicilan — edit itu ya nimpa
  langsung, titik.
- Tidak ada field status (lunas/belum, dsb) di Uang Diluar & Hutang Diluar — kalau sudah
  selesai/lunas, baris itu di-**hapus**, bukan ditandai.
- Tidak ada filter tanggal buat data ini (baik di CRUD list-nya maupun di `cash_summary`) — semua
  angkanya snapshot kondisi **saat ini**, bukan agregat periode.
- Tidak ada endpoint `GET /api/reports/cash-summary` berdiri sendiri — datanya cuma ada di dalam
  `GET /api/reports/dashboard` (`cash_summary` key), biar FE cukup 1x hit buat seluruh dashboard.

## Role & akses

**SUPER_ADMIN only** — lebih ketat dari kebanyakan resource lain di app ini (yang biasanya
ADMIN+SUPER_ADMIN). ADMIN dan KASIR sama sekali tidak boleh akses (backend akan balikin `403` buat
role selain SUPER_ADMIN). Halaman-halaman ini harus digating sama seperti halaman `/users` dan
`/reports/*` yang sudah ada — pakai `SUPER_ADMIN_ROLES` dari `src/config/nav.ts`.

---

## Dokumentasi API

Base URL & auth mengikuti konvensi yang sudah ada (`src/lib/api/client.ts` — Bearer token
otomatis, envelope `{success, data}` otomatis ke-unwrap jadi `T`, error jadi `ApiError`).

### `POST/GET/PUT/DELETE /api/balance-accounts` — Saldo Uang

```
POST   /api/balance-accounts          { name, balance }              -> 201 / 400 / 409
GET    /api/balance-accounts          (list flat, TANPA pagination)  -> 200
GET    /api/balance-accounts/{id}                                    -> 200 / 404
PUT    /api/balance-accounts/{id}     { name, balance }              -> 200 / 400 / 404 / 409
DELETE /api/balance-accounts/{id}                                    -> 200 / 404
```

Response tiap item:
```json
{
  "id": "3f4a5b6c-7d8e-9f01-2345-6789abcdef01",
  "name": "BCA Bisnis",
  "balance": 5000000,
  "created_at": "2026-08-06T09:00:00Z"
}
```

- `PUT` full-replace — kirim ulang `name` + `balance` setiap kali. Ini **adalah** cara edit saldo
  manual (mis. update setelah setoran) — tidak ada endpoint transaksi/mutasi terpisah.
- `name` unik → `409 CONFLICT` kalau dobel (mis. dua kali bikin "BCA Bisnis").
- `balance` tidak boleh negatif → `400 BAD_REQUEST` kalau < 0. Boleh `0` (rekening baru).
- `name` kosong → `400 BAD_REQUEST`.
- `DELETE` hard-delete beneran (tidak ada `is_active`) — habis dihapus, `GET` by id balikin `404`.

### `POST/GET/PUT/DELETE /api/external-funds` — Uang Diluar

```
POST   /api/external-funds          { description, amount }         -> 201 / 400
GET    /api/external-funds          (list flat, TANPA pagination)   -> 200
GET    /api/external-funds/{id}                                     -> 200 / 404
PUT    /api/external-funds/{id}     { description, amount }         -> 200 / 400 / 404
DELETE /api/external-funds/{id}                                     -> 200 / 404
```

Response tiap item:
```json
{
  "id": "4a5b6c7d-8e9f-0123-4567-89abcdef0123",
  "description": "Eliza Buyback 2 gram",
  "amount": 5000000,
  "created_at": "2026-08-06T09:00:00Z"
}
```

- `amount` itu **nominal Rupiah**, bukan gramasi — gramasi (kalau relevan) cukup ditulis manual di
  `description` sebagai teks bebas (contoh di atas: `"Eliza Buyback 2 gram"`).
- `description` kosong → `400`. `amount` harus `> 0` (nol/negatif → `400`).
- Kalau uangnya sudah settle/kembali, form-nya cukup tombol **Hapus** — tidak ada status "lunas".

### `POST/GET/PUT/DELETE /api/external-debts` — Hutang Diluar

```
POST   /api/external-debts          { debtor_name, amount }         -> 201 / 400
GET    /api/external-debts          (list flat, TANPA pagination)   -> 200
GET    /api/external-debts/{id}                                     -> 200 / 404
PUT    /api/external-debts/{id}     { debtor_name, amount }         -> 200 / 400 / 404
DELETE /api/external-debts/{id}                                     -> 200 / 404
```

Response tiap item:
```json
{
  "id": "5b6c7d8e-9f01-2345-6789-abcdef012345",
  "debtor_name": "Budi",
  "amount": 2000000,
  "created_at": "2026-08-06T09:00:00Z"
}
```

- `debtor_name` kosong → `400`. `amount` harus `> 0`.
- **Cicilan** = edit `amount` turun lewat `PUT` (mis. dari 2.000.000 jadi 1.000.000). Tidak ada
  endpoint pembayaran/cicilan terpisah — form edit-nya sama kayak form create, cuma prefilled.
- Sudah lunas → tombol **Hapus**, bukan tandai lunas.

### Error response (sama pola di ketiga resource)

```json
// 409 — nama saldo dobel
{"success":false,"error":{"code":"CONFLICT","message":"nama saldo sudah dipakai"}}

// 400 — field wajib kosong
{"success":false,"error":{"code":"BAD_REQUEST","message":"debtor_name wajib diisi"}}

// 400 — amount nol/negatif
{"success":false,"error":{"code":"BAD_REQUEST","message":"amount wajib diisi lebih besar dari 0"}}

// 404 — resource tidak ditemukan
{"success":false,"error":{"code":"NOT_FOUND","message":"hutang tidak ditemukan"}}
```

### `GET /api/reports/dashboard` — tambahan `cash_summary`

Endpoint yang sudah dipakai `dashboard-page.tsx` sekarang punya key baru `cash_summary`, sibling
dari `finance`/`transaction_breakdown`/dst (bukan nested di dalam `finance`):

```json
{
  "success": true,
  "data": {
    "from": "2026-08-01",
    "to": "2026-08-01",
    "finance": { "...": "sama seperti sebelumnya, tidak berubah" },
    "transaction_breakdown": [ "...": "tidak berubah" ],
    "...": "field lain semua tidak berubah",
    "cash_summary": {
      "total_gold_value": 150000000,
      "total_balance": 8500000,
      "total_external_funds": 5000000,
      "total_external_debts": 2000000
    }
  }
}
```

- `total_gold_value` — nilai stok emas yang masih ada di toko, dihitung **live** dari harga beli
  seluruh unit stok yang belum terjual (bukan field yang diinput manual).
- `total_balance` — jumlah seluruh saldo di `/api/balance-accounts` (termasuk entri "Cash").
- `total_external_funds` — jumlah seluruh `/api/external-funds`.
- `total_external_debts` — jumlah seluruh `/api/external-debts`.
- **Tidak terpengaruh filter `?from=&to=`** di level atas dashboard — keempat angka ini snapshot
  kondisi saat ini, bukan agregat periode. Kalau user ganti rentang tanggal di dashboard, keempat
  angka `cash_summary` **tetap sama** (hanya `finance`/`transaction_breakdown`/dll yang berubah).

---

## Rencana implementasi FE (mengikuti pola `expense-categories` yang sudah ada)

Resource `expense-categories` (`src/pages/expense-categories-page.tsx`,
`src/hooks/use-expense-categories.ts`, `src/types/expense-category.ts`,
`src/components/expenses/*-expense-category-dialog.tsx`) punya bentuk paling mirip: list flat
tanpa pagination, hard delete, dialog create/edit/delete terpisah. Pola yang sama tinggal
diduplikasi 3x buat resource baru ini.

### 1. Types — `src/types/`
- `balance-account.ts` — `{ id, name, balance, created_at }`
- `external-fund.ts` — `{ id, description, amount, created_at }`
- `external-debt.ts` — `{ id, debtor_name, amount, created_at }`
- Extend `src/types/dashboard-report.ts`: tambah `CashSummary` interface + field
  `cash_summary: CashSummary` di `DashboardReport`.

### 2. Hooks — `src/hooks/`
- `use-balance-accounts.ts`, `use-external-funds.ts`, `use-external-debts.ts` — masing-masing
  `useQuery` list (`queryKey: ['balance-accounts']` dst, `api.get<T[]>('/balance-accounts')`,
  **plain array, jangan pasang `pagination` prop ke `DataTable`** — sama seperti catatan yang
  sudah ada di `CLAUDE.md` soal `expense-categories`).
- Dashboard hook yang sudah ada (di `dashboard-page.tsx`) otomatis dapat `cash_summary` tanpa
  perubahan hook — cuma perlu extend type-nya (poin 1) dan pakai field barunya di komponen.

### 3. Komponen dialog — `src/components/balance-accounts/`, `external-funds/`, `external-debts/`
Masing-masing 3 file (create/edit/delete), niru struktur
`src/components/expenses/*-expense-category-dialog.tsx`:
- Create/Edit: form `name`+`balance` (atau `description`+`amount`, atau `debtor_name`+`amount`),
  validasi client-side selaras sama validasi backend (required, `balance >= 0`, `amount > 0`) —
  taruh di `src/lib/*-validation.ts` baru per resource, ikut pola file validasi lain yang sudah ada.
- Delete: `ConfirmDialog` biasa (sama pola `delete-expense-category-dialog.tsx`), copy-nya tegas
  ("Hapus permanen, tidak bisa dibatalkan") karena ini **hard delete**, bukan nonaktifkan.

### 4. Halaman — `src/pages/`
- `balance-accounts-page.tsx`, `external-funds-page.tsx`, `external-debts-page.tsx` — masing-masing
  `DataTable` + tombol "Tambah" + 3 dialog, niru `expense-categories-page.tsx` 1:1. Kolom tabel:
  - Saldo Uang: Nama, Saldo (format Rupiah pakai `formatCurrency` dari `src/lib/format.ts`), Aksi.
  - Uang Diluar: Keterangan, Nominal, Aksi.
  - Hutang Diluar: Nama Peminjam, Nominal, Aksi.

### 5. Routing — `src/app/router.tsx`
Tambah 3 route baru di dalam blok `RoleGuard roles={SUPER_ADMIN_ROLES}` yang sudah ada (baris
~104-113, satu grup sama `dashboard`/`reports/*`/`users`):
```tsx
{ path: 'balance-accounts', element: <BalanceAccountsPage /> },
{ path: 'external-funds', element: <ExternalFundsPage /> },
{ path: 'external-debts', element: <ExternalDebtsPage /> },
```

### 6. Nav menu — `src/config/nav.ts`
Tambah group baru "Kas" (atau gabung ke dalam group "Laporan" yang sudah ada — didiskusikan sama
desainer/PM), pola sama seperti group "Laporan" yang sudah ada:
```ts
{
  type: 'group',
  title: 'Kas',
  icon: Wallet, // atau ikon lain yang cocok, dari lucide-react
  roles: SUPER_ADMIN_ROLES,
  children: [
    { title: 'Saldo Uang', url: '/balance-accounts' },
    { title: 'Uang Diluar', url: '/external-funds' },
    { title: 'Hutang Diluar', url: '/external-debts' },
  ],
},
```

### 7. Dashboard — `src/pages/dashboard-page.tsx`
Tambah section "Ringkasan Kas" (mis. 4 `KpiCard` baru, pola sama seperti 4 `KpiCard` yang sudah ada
di baris ~124-148), pakai `report.cash_summary`:
- Total Uang Emas → `report.cash_summary.total_gold_value`
- Total Saldo → `report.cash_summary.total_balance`
- Uang Diluar → `report.cash_summary.total_external_funds`
- Hutang Diluar → `report.cash_summary.total_external_debts`

Semua di-`formatCurrency(...)`, sama seperti KPI card lain di halaman ini. Section ini **tidak
perlu ikut filter tanggal** yang ada di header dashboard (angkanya memang tidak berubah oleh filter
itu — lihat catatan di dokumentasi API di atas), jadi taruh terpisah secara visual dari KPI
finance/transaksi supaya user tidak salah kira ini juga kefilter tanggal.

---

## Acceptance Criteria

- [ ] Non-SUPER_ADMIN (ADMIN/KASIR) tidak bisa akses `/balance-accounts`, `/external-funds`,
      `/external-debts` (redirect ke `/403`, dan menu-nya tidak muncul di sidebar).
- [ ] CRUD Saldo Uang: create, list, edit (update `name`/`balance`), delete — semuanya jalan, error
      409 (nama dobel) dan 400 (balance negatif) ke-handle dengan toast error yang jelas.
- [ ] CRUD Uang Diluar: create, list, edit, delete — 400 (description kosong / amount ≤0) ke-handle.
- [ ] CRUD Hutang Diluar: create, list, edit (termasuk skenario "cicilan" — edit amount turun),
      delete — 400 ke-handle.
- [ ] Dashboard menampilkan 4 angka `cash_summary` dengan benar, format Rupiah, dan **tidak berubah**
      saat filter tanggal dashboard diganti.
- [ ] Tidak ada UI untuk "tandai lunas"/status/riwayat di Uang Diluar & Hutang Diluar — cuma
      create/edit/delete (sesuai desain backend yang sengaja tanpa history).
