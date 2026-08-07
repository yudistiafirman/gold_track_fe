# Batalkan Transaksi (Cancel Sale/Buyback)

> Belum ada nomor tiket resmi (FE-XXXX) — sesuaikan dengan penomoran di tracker internal saat
> diimport. Backend sudah selesai, sudah dites (e2e), dan migration-nya sudah live di database.

## Latar belakang

Client minta bisa membatalkan transaksi setelah dibuat (misal salah input, salah scan barang, dsb).
Sebelumnya transaksi (`SELL`, `SELL_SUPPLIER`, `BUY`) sekali dibuat sifatnya final — sekarang ada
endpoint baru buat membatalkannya, dengan efek balik ke stok yang beda tergantung tipe transaksinya.

**Kenapa efeknya beda per tipe** — ini penting buat dipahami sebelum implementasi FE:

- **Cancel `SELL` / `SELL_SUPPLIER`** → unit (`stock_items`) yang tadi kejual balik jadi
  `AVAILABLE`. Alasannya: unit itu memang sudah ada di stok toko sebelum terjual, cancel cuma
  membatalkan penjualannya, barangnya balik bisa dijual lagi.
- **Cancel `BUY` (buyback)** → unit yang tadi dibuat oleh transaksi buyback itu jadi status
  **`VOID`** (status baru, bukan `AVAILABLE`). Alasannya: unit itu baru tercipta gara-gara buyback
  itu sendiri — kalau transaksinya dibatalkan, unit itu sebenarnya gak pernah legit masuk stok
  toko, jadi gak boleh jadi `AVAILABLE` (seolah toko punya barang itu). `VOID` = mati permanen,
  tidak pernah bisa dijual lagi, tapi barisnya tetap ada di database untuk histori (unit `SOLD`
  juga tidak pernah dihapus, dengan alasan yang sama).

## Scope

**In scope:**
- Tombol "Batalkan Transaksi" di halaman struk (`transaction-receipt-page.tsx`) — satu-satunya
  halaman FE saat ini yang menampilkan detail 1 transaksi.
- Confirm dialog sebelum cancel beneran jalan (pola sama seperti
  `cancel-purchase-order-dialog.tsx` yang sudah ada untuk PO).
- Tombol hanya muncul untuk role `ADMIN`/`SUPER_ADMIN`, dan hanya kalau `status` transaksinya
  masih `COMPLETED` (transaksi yang sudah `CANCELLED` tidak bisa dibatalkan lagi — backend akan
  balikin `409` kalau dipaksa).
- Badge status baru: `CANCELLED` (transaksi) dan `VOID` (stock item) harus tampil dengan tone yang
  benar di semua tempat yang sudah nampilin `StatusBadge` untuk status ini (lihat bagian
  "Domain status mappings" di bawah) — **kalau tidak ditambahkan, badge-nya tetap jalan tapi
  fallback ke abu-abu polos tanpa error**, jadi ini bukan blocker teknis, tapi tetap harus
  dikerjakan biar konsisten sama pola cancel/dibatalkan lain di app (PO `DIBATALKAN` juga abu-abu).

**Out of scope (sengaja tidak ada, jangan ditambahin di FE juga):**
- Tidak ada halaman list "riwayat transaksi" tersendiri di luar yang sudah ada (customer/supplier
  history) — cancel cuma diakses dari halaman struk transaksi yang sudah ada.
- Tidak ada alasan/notes wajib diisi saat cancel — endpoint-nya `POST` tanpa body sama sekali.
- Tidak ada batasan waktu (mis. "cuma bisa cancel di hari yang sama") — ini keputusan sengaja dari
  client, cancel bisa dilakukan kapan saja selama status masih `COMPLETED`.
- `VOID` **tidak** ditambahkan sebagai opsi di filter status dropdown stock items
  (`stock-items-tab.tsx`) — backend juga sengaja tidak mengizinkan `?status=VOID` sebagai filter
  query (cuma `AVAILABLE`/`SOLD` yang valid). Unit `VOID` tetap muncul kalau filter status = "Semua
  status", cuma tidak bisa difilter khusus.

## Role & akses

**ADMIN + SUPER_ADMIN** — `KASIR` sama sekali tidak boleh cancel (backend balikin `403`). Ini beda
dari kebanyakan resource `transactions` lain yang kebuka buat semua role (create transaksi, lihat
struk) — cancel-nya spesifik lebih ketat.

Halaman struk sendiri (`/transactions/:id/receipt`) **tetap bisa diakses semua role** seperti
sekarang (KASIR butuh lihat/cetak struk pas checkout) — jadi tombol cancel-nya **harus** di-gate
per-komponen pakai `useCan`, bukan lewat `RoleGuard` di level route seperti halaman PO/reports.
Default `RESOURCE_OVERRIDES` di `src/lib/permissions.ts` sudah `ADMIN_ROLES` (`['ADMIN',
'SUPER_ADMIN']`) untuk resource yang tidak dioverride — jadi `useCan('delete', 'transactions')`
langsung cocok tanpa perlu nambah entry baru di `RESOURCE_OVERRIDES`.

---

## Dokumentasi API

### `POST /api/transactions/{id}/cancel`

```
POST /api/transactions/{id}/cancel   (tanpa body)   -> 200 / 403 / 404 / 409
```

Response `200` — **shape sama persis dengan `GET /api/transactions/{id}`** (transaksi lengkap
dengan `items`), cuma `status` sudah `"CANCELLED"`:

```json
{
  "success": true,
  "data": {
    "id": "3f4a5b6c-7d8e-9f01-2345-6789abcdef01",
    "transaction_code": "TRX-20260807-0004",
    "type": "SELL",
    "total_amount": 1500000,
    "total_weight": 10,
    "payment_method": "CASH",
    "payment_ref": "",
    "status": "CANCELLED",
    "items": [
      {
        "id": "...",
        "stock_item_id": "...",
        "barcode": "...",
        "serial_number": "...",
        "product_name": "...",
        "weight_gram": 10,
        "price_per_gram": 150000,
        "price_total": 1500000
      }
    ],
    "created_at": "2026-08-07T09:00:00Z",
    "completed_at": "2026-08-07T09:00:00Z"
  }
}
```

Error cases:
```json
// 403 — role KASIR
{"success":false,"error":{"code":"FORBIDDEN","message":"Anda tidak memiliki akses untuk aksi ini"}}

// 404 — id tidak ditemukan / format id salah
{"success":false,"error":{"code":"NOT_FOUND","message":"transaksi tidak ditemukan"}}

// 409 — transaksi ini sudah pernah di-cancel sebelumnya
{"success":false,"error":{"code":"CONFLICT","message":"transaksi sudah dibatalkan"}}

// 409 — khusus type BUY: unit hasil buyback-nya sudah kejual lagi
// di transaksi lain, jadi gak bisa di-undo lagi
{"success":false,"error":{"code":"CONFLICT","message":"unit hasil buyback ini sudah terjual lagi di transaksi lain, tidak bisa dibatalkan"}}
```

Kasus 409 terakhir itu **khusus buat cancel `BUY`** — kalau toko sudah beli barang dari customer
(buyback), terus barang itu dijual lagi ke customer lain, transaksi buyback yang pertama itu **gak
bisa dibatalkan lagi** karena barangnya sudah keluar dari toko lagi. Error message-nya sebaiknya
ditampilkan apa adanya lewat `showErrorToast` (sudah otomatis baca `.message` dari `ApiError`),
tidak perlu logic tambahan di FE untuk bedain kasus ini dari 409 "sudah dibatalkan".

### Field yang berubah di resource lain

- `GET /api/transactions/{id}`, `.../receipt`, dan riwayat transaksi customer/supplier — field
  `status` sekarang bisa bernilai `"CANCELLED"` selain `"COMPLETED"` yang sudah ada.
- `GET /api/stock-items/{id}` dan list stock items — field `status` sekarang bisa bernilai
  `"VOID"` selain `"AVAILABLE"`/`"SOLD"` yang sudah ada. Unit `VOID` **tidak pernah** balik ke
  status lain, dan tidak terhitung sebagai stok tersedia di manapun (nilai stok di dashboard, hasil
  pencarian/lookup pas checkout, dsb — semua ini backend yang jaga, FE tidak perlu filter manual).

---

## Rencana implementasi FE

### 1. Domain status — `src/lib/domain-status.ts`
Tambah 2 entry, tone `'gray'` biar konsisten sama pola status "dibatalkan" lain di app (PO
`DIBATALKAN` juga `'gray'`, bukan merah):

```ts
export const TRANSACTION_STATUS_TONE = {
  COMPLETED: 'success',
  CANCELLED: 'gray', // baru
} as const satisfies Record<string, StatusTone>

export const STOCK_STATUS_TONE = {
  AVAILABLE: 'success',
  SOLD: 'gray',
  VOID: 'gray', // baru
} as const satisfies Record<string, StatusTone>
```
`StockStatus`/`TransactionStatus`-nya (kalau ada) otomatis ikut melebar karena keduanya derived
via `keyof typeof ...` — cek `src/types/stock-item.ts` (`status: StockStatus`) tetap valid tanpa
perubahan lain.

### 2. Dialog — `src/components/transactions/cancel-transaction-dialog.tsx` (baru)
Copy 1:1 pola `src/components/purchase-orders/cancel-purchase-order-dialog.tsx` (sudah ada,
struktur props/mutation/error-handling-nya persis yang dibutuhkan di sini):
- Props: `transaction: { id: string; transactionCode: string } | null`, `onClose: () => void`.
- `useMutation` → `api.post(\`/transactions/${transaction?.id}/cancel\`)`.
- `onSuccess` → invalidate query struk (`['transactions', id, 'receipt']`) biar halaman refetch dan
  nampilin status `CANCELLED` + stock item ter-update tanpa reload manual, lalu `showSuccessToast`.
- Body dialog: jelasin efeknya beda per tipe (pakai `transaction.type` kalau mau lebih spesifik,
  atau copy netral "Transaksi akan dibatalkan dan efeknya ke stok akan otomatis disesuaikan" kalau
  mau simpel) — konfirmasi ke desainer/PM copy final-nya.
- Tombol konfirmasi `variant="destructive"`, label "Batalkan Transaksi".

### 3. Halaman struk — `src/pages/transaction-receipt-page.tsx`
- State `const [cancelling, setCancelling] = useState<{id: string; transactionCode: string} | null>(null)`.
- Tombol baru di header (sebelah tombol "Cetak Struk" yang sudah ada), tampil kalau
  `useCan('delete', 'transactions') && receipt.status === 'COMPLETED'`:
  ```tsx
  {canCancel && receipt.status === 'COMPLETED' && (
    <Button variant="secondary" onClick={() => setCancelling({ id: receipt.id, transactionCode: receipt.transaction_code })}>
      <X />
      Batalkan Transaksi
    </Button>
  )}
  ```
- Render `<CancelTransactionDialog transaction={cancelling} onClose={() => setCancelling(null)} />`
  di akhir JSX, sama seperti pola `CancelPurchaseOrderDialog` di `purchase-order-detail-page.tsx`.
- `receipt.id`/`receipt.transaction_code` sudah ada di `TransactionReceipt`
  (`src/types/transaction-receipt.ts`) — tidak perlu field baru.

### 4. Riwayat transaksi customer/supplier — cek saja, kemungkinan tidak perlu perubahan
`customer-transaction-history.tsx` dan `supplier-transaction-history.tsx` sudah render `status`
lewat `StatusBadge` + `resolveStatusTone` (asumsi mengikuti pola yang sama seperti receipt page) —
begitu `CANCELLED` ditambahkan ke `TRANSACTION_STATUS_TONE` (poin 1), badge-nya otomatis benar di
kedua tempat ini tanpa perubahan kode lain. Cukup diverifikasi visual, bukan perubahan logic.

---

## Acceptance Criteria

- [ ] Tombol "Batalkan Transaksi" muncul di halaman struk **hanya** untuk role `ADMIN`/
      `SUPER_ADMIN`, dan **hanya** kalau `status` transaksi masih `COMPLETED`.
- [ ] Klik tombol → confirm dialog muncul, klik "Batal" di dialog tidak melakukan apa-apa.
- [ ] Konfirmasi cancel pada transaksi `SELL`/`SELL_SUPPLIER` → sukses, toast muncul, halaman
      struk refresh menampilkan status `CANCELLED` (badge abu-abu).
- [ ] Konfirmasi cancel pada transaksi `BUY` → sukses, toast muncul, badge status jadi
      `CANCELLED`.
- [ ] Coba cancel transaksi yang statusnya sudah `CANCELLED` (mis. lewat 2 tab / race) → toast
      error menampilkan pesan dari backend ("transaksi sudah dibatalkan"), tombol cancel tidak
      lagi muncul setelah refresh karena status sudah bukan `COMPLETED`.
- [ ] Cancel transaksi `BUY` yang unit-nya sudah kejual lagi di transaksi lain → toast error
      menampilkan pesan dari backend apa adanya (409), tidak crash.
- [ ] Role `KASIR` tidak melihat tombol cancel sama sekali di halaman struk (meski dia tetap bisa
      lihat/cetak struk seperti biasa).
- [ ] Unit stok yang statusnya `VOID` (hasil cancel buyback) tampil dengan badge abu-abu yang benar
      di tab stock items produk, tidak blank/error, meski tidak muncul di opsi filter status.
