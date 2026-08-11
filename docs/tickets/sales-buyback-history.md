# Riwayat Penjualan & Buyback (List per Transaksi)

> Belum ada nomor tiket resmi (FE-XXXX) — sesuaikan dengan penomoran di tracker internal saat
> diimport. Backend sudah selesai, sudah dites (e2e), tidak butuh migration (endpoint baru, tidak ada
> perubahan skema DB).

## Latar belakang

Client minta laporan penjualan harian ditampilkan **per transaksi** (siapa beli apa, kapan, berapa),
bukan cuma angka ringkasan. Selama ini satu-satunya endpoint transaksi yang query-able adalah
`GET /api/reports/transactions` — itu **aggregate-only** (total per tipe transaksi dalam rentang
tanggal, dipakai juga oleh Dashboard), tidak pernah balikin baris per transaksi, dan sengaja
dipertahankan begitu (`SUPER_ADMIN`-only, no pagination).

Backend sekarang menambahkan endpoint baru, `GET /api/transactions`, yang balikin transaksi
satu-per-satu (paginated, bisa difilter tipe & rentang tanggal) — ini yang jadi dasar 2 halaman baru
di tiket ini: **Riwayat Penjualan** dan **Riwayat Buyback**.

**Halaman checkout yang sudah ada (`/sell`, `/buyback`) tidak berubah sama sekali** — tetap langsung
form transaksi baru seperti sekarang, KASIR tetap landing di situ pas login
(`index-redirect.tsx:8`). Halaman riwayat ini ditaruh di **tempat terpisah**, bukan menggantikan
`/sell`/`/buyback`, biar flow checkout kasir yang sudah jalan tidak keganggu.

## Scope

**In scope:**
- 2 halaman baru: **Riwayat Penjualan** (`/sell/history`) dan **Riwayat Buyback**
  (`/buyback/history`) — list transaksi per baris, dengan pagination, filter tanggal (`from`/`to`),
  dan tombol "Buat Penjualan"/"Buat Buyback" yang link ke `/sell`/`/buyback` (pola sama seperti
  tombol "Buat PO" di `purchase-orders-page.tsx`).
- Nav item baru di sidebar, section "Transaksi": "Riwayat Penjualan" & "Riwayat Buyback".
- Tiap baris di list nampilin nama customer (Penjualan) atau customer juga (Buyback — buyback selalu
  dari customer, endpoint-nya tidak pernah mengisi `supplier` untuk tipe `BUY`) — lihat bagian
  "Dokumentasi API" di bawah, field `customer`/`supplier` baru ditambahkan khusus buat kebutuhan ini.
- Baris kode transaksi link ke halaman struk yang sudah ada (`/transactions/:id`) — pola sama seperti
  `customer-transaction-history.tsx`.
- Badge status pakai `StatusBadge` + `TRANSACTION_STATUS_TONE` (`src/lib/domain-status.ts`) yang
  sudah ada dari tiket `cancel-transaction.md` — tidak perlu tambahan tone baru, `COMPLETED`/
  `CANCELLED` sudah dipetakan.

**Out of scope (sengaja tidak ada, jangan ditambahin di FE juga):**
- **Tidak ada halaman "Riwayat Jual ke Supplier"** (`SELL_SUPPLIER`) di tiket ini — cuma 2 tipe yang
  diminta client (Penjualan ke customer & Buyback). `SELL_SUPPLIER` tetap bisa dilihat lewat
  `/reports/transactions?type=SELL_SUPPLIER` (aggregate) seperti sekarang; kalau nanti dibutuhkan
  list per-transaksinya juga, endpoint `GET /api/transactions?type=SELL_SUPPLIER` sudah siap dipakai,
  tinggal bikin halaman ke-3 dengan pola yang sama.
- **Tidak ada export/CSV** di 2 halaman ini — beda dari `transactions-report-page.tsx` yang punya
  tombol Export. Bisa ditambah belakangan sebagai enhancement terpisah kalau diminta.
- **`/sell` dan `/buyback` (checkout) tidak diubah** — jangan pindahin form checkout ke
  `/sell/new`/`/buyback/new`, jangan ubah `index-redirect.tsx`. Ini keputusan sengaja supaya flow
  KASIR yang sudah ada tidak kesenggol.
- **Tidak ada filter customer/supplier** di list (mis. dropdown pilih customer tertentu) — backend
  belum support filter itu di endpoint ini (`ListByCustomer` yang sudah ada tetap jadi cara buat lihat
  histori 1 customer spesifik, lewat halaman detail customer). Kalau nanti dibutuhkan, itu perubahan
  backend dulu, bukan sesuatu yang bisa di-workaround di FE.

## Role & akses

**Semua role yang login (termasuk `KASIR`)** — sama seperti `/sell`, `/buyback`, dan
`GET /transactions/{id}` (struk) yang sudah terbuka buat semua role. Ini beda dari
`/reports/transactions` yang `SUPER_ADMIN`-only. Jadi nav item barunya pakai `roles: ALL_ROLES`
(`src/config/nav.ts`), dan **tidak** perlu dibungkus `<RoleGuard>` di `router.tsx`.

---

## Dokumentasi API

### `GET /api/transactions`

```
GET /api/transactions?type=SELL&from=2026-08-01&to=2026-08-12&page=1&limit=20   -> 200 / 400 / 401
```

Query params (semua opsional):
- `type` — `SELL` | `BUY` | `SELL_SUPPLIER`. Halaman Riwayat Penjualan selalu kirim `type=SELL`,
  Riwayat Buyback selalu `type=BUY`. Tanpa `type`, balikin semua tipe (tidak dipakai di 2 halaman
  ini, tapi endpointnya mendukung).
- `from` / `to` — format `YYYY-MM-DD`, inclusive, filter `created_at` (UTC, sama semantiknya dengan
  `/reports/transactions`). Tanpa keduanya, tidak ada batas tanggal (semua transaksi).
- `page` (default 1), `limit` (default 20, maks 100) — pagination standar, sama shape-nya dengan
  endpoint list lain di app.

Response `200`:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "3f4a5b6c-7d8e-9f01-2345-6789abcdef01",
        "transaction_code": "TRX-20260812-0004",
        "type": "SELL",
        "total_amount": 1500000,
        "total_weight": 10,
        "payment_method": "CASH",
        "payment_ref": "",
        "status": "COMPLETED",
        "customer": { "id": "c1a2b3c4-...", "name": "Budi Santoso" },
        "supplier": null,
        "created_at": "2026-08-12T09:00:00Z",
        "completed_at": "2026-08-12T09:00:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1, "total_pages": 1 }
  }
}
```

**Field baru dibanding pola list transaksi lain yang sudah ada** (`customer-transaction-history.tsx`
dkk.): `customer` dan `supplier`, masing-masing `{ id, name } | null` (`id` di sini `public_id`
customer/supplier, bukan FK internal — konsisten sama semua identifier lain di API). Hanya salah satu
yang pernah terisi, sesuai tipe transaksinya:
- `type: "SELL"` atau `"BUY"` → `customer` terisi, `supplier` selalu `null`.
- `type: "SELL_SUPPLIER"` → `supplier` terisi, `customer` selalu `null`.

Kedua field ini pakai shape generik `{id, name}` yang sama dipakai di tempat lain di app (mis.
`category` pada response produk) — bukan objek khusus transaksi.

Error cases:
```json
// 400 — type bukan salah satu dari SELL/BUY/SELL_SUPPLIER
{"success":false,"error":{"code":"BAD_REQUEST","message":"type harus SELL, BUY, atau SELL_SUPPLIER"}}

// 400 — from/to bukan format YYYY-MM-DD
{"success":false,"error":{"code":"BAD_REQUEST","message":"from harus format YYYY-MM-DD"}}

// 401 — tidak login / token invalid
{"success":false,"error":{"code":"UNAUTHORIZED","message":"..."}}
```

Tidak ada kasus 403 — semua role yang login boleh akses endpoint ini (lihat "Role & akses" di atas).

---

## Rencana implementasi FE

### 1. Type — `src/types/transaction-list-item.ts` (baru)

```ts
export interface TransactionPartyRef {
  id: string
  name: string
}

export type TransactionListType = 'SELL' | 'BUY' | 'SELL_SUPPLIER'

export interface TransactionListItem {
  id: string
  transaction_code: string
  type: TransactionListType
  total_amount: number
  total_weight: number
  payment_method: string
  payment_ref: string
  status: string
  customer: TransactionPartyRef | null
  supplier: TransactionPartyRef | null
  created_at: string
  completed_at: string | null
}
```

### 2. Komponen list — `src/components/transactions/transaction-history-table.tsx` (baru)

Kedua halaman (Penjualan & Buyback) tabel-nya identik kecuali tipe transaksi yang difilter dan label
kolom pihak (Customer vs Customer juga, jadi sebenarnya kolomnya sama — lihat catatan di scope soal
`BUY` selalu punya `customer`, tidak pernah `supplier`). Daripada duplikasi 2 halaman penuh, satu
komponen reusable dengan prop `type`:

```tsx
interface TransactionHistoryTableProps {
  type: 'SELL' | 'BUY'
  queryKeyPrefix: string // 'sell-history' | 'buyback-history', biar cache react-query tidak nabrak
}

const PAGE_SIZE = 20

export function TransactionHistoryTable({ type, queryKeyPrefix }: TransactionHistoryTableProps) {
  const [page, setPage] = useState(1)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const query = useQuery({
    queryKey: [queryKeyPrefix, { page, from, to }],
    queryFn: () =>
      api.get<{ items: TransactionListItem[]; pagination: PaginationMeta }>('/transactions', {
        params: { type, from: from || undefined, to: to || undefined, page, limit: PAGE_SIZE },
      }),
    placeholderData: keepPreviousData,
  })

  // columns: transaction_code (Link ke /transactions/:id), party (row.customer?.name ?? '-'),
  // created_at (formatDate), total_amount (formatCurrency), total_weight (`${w} gr`),
  // payment_method, status (StatusBadge + resolveStatusTone(TRANSACTION_STATUS_TONE, row.status))

  // filters slot: 2x <Input type="date"> (from/to, reset page ke 1 tiap berubah) — pola sama seperti
  // report-from/report-to di transactions-report-page.tsx, tapi tanpa tombol "Terapkan" terpisah,
  // cukup langsung apply on-change (list ini tidak butuh KPI card jadi lebih ringan dari halaman
  // report), plus tombol "Buat Penjualan"/"Buat Buyback" di kanan.
}
```

Copy tombol create & link tujuannya beda per tipe:
- `type="SELL"` → tombol "Buat Penjualan", link `/sell`.
- `type="BUY"` → tombol "Buat Buyback", link `/buyback`.

### 3. Halaman — 2 file baru, masing-masing tipis, cuma pasang judul + komponen di atas

`src/pages/sales-history-page.tsx`:
```tsx
export function SalesHistoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h1 text-gray-900">Riwayat Penjualan</h1>
        <p className="text-caption text-gray-500">Daftar transaksi penjualan ke pelanggan.</p>
      </div>
      <TransactionHistoryTable type="SELL" queryKeyPrefix="sell-history" />
    </div>
  )
}
```

`src/pages/buyback-history-page.tsx` — sama persis, judul "Riwayat Buyback", `type="BUY"`,
`queryKeyPrefix="buyback-history"`.

### 4. Routing — `src/app/router.tsx`

Tambah 2 route baru di dalam `AppLayout`, **di luar** blok `<RoleGuard roles={ADMIN_ROLES}>` /
`<RoleGuard roles={SUPER_ADMIN_ROLES}>` (semua role boleh akses) — taruh dekat route `sell`/`buyback`
yang sudah ada:

```tsx
{ path: 'sell', element: <SellPage /> },
{ path: 'sell/history', element: <SalesHistoryPage /> },
{ path: 'buyback', element: <BuybackPage /> },
{ path: 'buyback/history', element: <BuybackHistoryPage /> },
```

### 5. Nav — `src/config/nav.ts`

Section "Transaksi" jadi 4 item (tambahkan 2 baru, `roles: ALL_ROLES` sama seperti yang sudah ada):

```ts
{
  label: 'Transaksi',
  items: [
    { type: 'link', title: 'Penjualan', url: '/sell', icon: ShoppingCart, roles: ALL_ROLES },
    { type: 'link', title: 'Riwayat Penjualan', url: '/sell/history', icon: Receipt, roles: ALL_ROLES },
    { type: 'link', title: 'Buyback', url: '/buyback', icon: RefreshCw, roles: ALL_ROLES },
    { type: 'link', title: 'Riwayat Buyback', url: '/buyback/history', icon: Receipt, roles: ALL_ROLES },
  ],
},
```

`Receipt` sudah diimport di file ini (dipakai untuk nav "Pengeluaran") — pilih icon lain kalau mau
beda visual antara Riwayat Penjualan vs Riwayat Buyback (mis. `History` dari `lucide-react`), bukan
keharusan teknis.

---

## Acceptance Criteria

- [ ] Menu sidebar punya 2 item baru: "Riwayat Penjualan" dan "Riwayat Buyback", muncul untuk semua
      role termasuk `KASIR`.
- [ ] Buka "Riwayat Penjualan" → list transaksi `type=SELL` saja, terbaru dulu, nama customer
      tampil per baris, klik kode transaksi → masuk halaman struk (`/transactions/:id`).
- [ ] Buka "Riwayat Buyback" → list transaksi `type=BUY` saja, nama customer tampil (buyback juga
      dari customer, bukan supplier).
- [ ] Filter tanggal (`from`/`to`) mengubah hasil list sesuai rentang, dan pagination tetap benar
      (`total`/`total_pages` dari response, bukan dihitung manual di FE).
- [ ] Tombol "Buat Penjualan" di halaman Riwayat Penjualan mengarah ke `/sell` (form checkout yang
      sudah ada, tidak berubah). Sama untuk "Buat Buyback" → `/buyback`.
- [ ] Transaksi berstatus `CANCELLED` tetap muncul di list dengan badge abu-abu (bukan hilang dari
      list) — endpoint tidak memfilter status.
- [ ] `/sell` dan `/buyback` (checkout) tetap berperilaku persis seperti sebelum tiket ini — KASIR
      tetap landing di `/sell` setelah login, tidak ada regresi di flow checkout.
- [ ] List kosong (belum ada transaksi / filter tidak match) menampilkan empty state, bukan error atau
      tabel kosong tanpa penjelasan.
