# Input Manual Item Penjualan (Emas Bukan dari Stok Tercatat)

> Belum ada nomor tiket resmi (FE-XXXX) — sesuaikan dengan penomoran di tracker internal saat
> diimport. Backend sudah selesai, sudah dites (e2e), tidak butuh migration (endpoint lama yang
> di-extend, bukan endpoint baru).

## Latar belakang

Client kadang jual emas yang **bukan dari stok toko yang tercatat** — misal dagangan
titipan/reseller yang langsung lewat tanpa pernah numpuk di rak toko — tapi labanya tetap harus
kecatat di laporan keuangan seperti penjualan biasa. Selama ini halaman Penjualan (`/sell`) cuma
bisa jual unit yang di-scan (harus ada barcode fisik, artinya harus sudah jadi baris `stock_items`
lebih dulu) — tidak ada jalan buat "jual barang yang gak pernah discan".

Backend sekarang extend `POST /api/transactions` (type `SELL`/`SELL_SUPPLIER`) supaya satu item bisa
diisi manual: pilih produk dari katalog + serial number ketik manual + harga modal + harga jual —
alih-alih `stock_item_id` hasil scan. Di belakang layar backend bikin unit `stock_items` baru DAN
langsung menjualnya dalam satu transaksi DB yang sama (jadi unit itu tidak pernah muncul sebagai
stok "tersedia" di manapun), tapi laba (`harga jual - harga modal`) tetap masuk ke
`/api/reports/finance` persis seperti penjualan unit yang di-scan — **tidak ada perubahan di
halaman laporan**, cukup di form checkout.

**Buyback (`/buyback`) tidak berubah sama sekali** — buyback dari dulu memang sudah "manual" (pilih
produk + isi serial number + kondisi + harga beli, tidak pernah ada scan), jadi field/dialog yang
sudah ada di situ (`AddBuybackItemDialog`) sebenarnya sudah persis pola yang dibutuhkan tiket ini —
banyak yang bisa dicontek 1:1.

## Scope

**In scope:**
- Tombol baru di halaman Penjualan (`/sell`), sejajar dengan input scan barcode — "Tambah Item
  Manual" — buka dialog form: pilih produk (pakai `PickProductDialog` yang sudah ada), serial number,
  kondisi, harga modal, tahun produksi (opsional). Setelah ditambahkan, item masuk ke **keranjang
  yang sama** dengan item hasil scan (satu transaksi bisa campur item scan + manual, backend sudah
  mendukung ini).
- Harga jual (`price_total`) item manual tetap diisi/diedit lewat kolom "Harga/Unit" yang **sudah
  ada** di tabel keranjang (`sell-page.tsx`) — sama seperti item hasil scan, supaya kasir tidak perlu
  belajar 2 pola input harga jual berbeda. Dialog tambah item cuma minta harga modal (dan
  detail unit), bukan harga jual.
- Berlaku untuk kedua tipe transaksi di halaman Penjualan: `SELL` (ke pelanggan) maupun
  `SELL_SUPPLIER` (jual balik ke supplier) — toggle tipe yang sudah ada tetap dipakai apa adanya,
  tidak ada perubahan di situ.
- Kondisi `BAD` + tipe `SELL` (jual ke pelanggan, bukan `SELL_SUPPLIER`) tetap butuh konfirmasi
  eksplisit sebelum item manual masuk keranjang — sama semangatnya dengan
  `ConfirmBadConditionDialog` yang sudah ada buat item hasil scan, tapi **tidak bisa reuse
  komponen itu langsung** (propnya terikat ke `StockItemLookupResult`, hasil lookup barcode — item
  manual tidak pernah lewat lookup). Rekomendasi: checkbox konfirmasi di dalam dialog tambah item
  itu sendiri, cuma muncul kalau kondisi dipilih `BAD` dan tipe transaksi `SELL` — submit diblokir
  kalau kondisi `BAD` tapi checkbox belum dicentang. Desain persis (dialog terpisah vs. inline
  checkbox) didiskusikan dengan desainer kalau perlu, ini cuma rekomendasi teknis.
- Kolom tabel keranjang yang sudah ada (`sell-page.tsx`) perlu render 2 jenis baris (scan & manual)
  dengan data yang sedikit beda sumbernya (lihat "Rencana implementasi" di bawah) — bukan tabel
  baru, kolom yang sama dipakai untuk keduanya.
- Response error 422 (`serial_number`/`condition`/`cost_total` kosong/invalid) dan 409 (`serial_number`
  bentrok) dari backend perlu ditampilkan sebagai error di dalam dialog tambah item (per-field kalau
  bisa dipetakan, fallback ke toast/`showErrorToast` kalau tidak) — pola sama seperti error handling
  `AddBuybackItemDialog`/checkout yang sudah ada.

**Out of scope (sengaja tidak ada, jangan ditambahin di FE juga):**
- **Halaman Buyback (`/buyback`) tidak disentuh** — sudah "manual" dari awal, tidak butuh perubahan
  apapun dari tiket ini.
- **Tidak ada indikator visual "item ini manual vs item ini dari stok tercatat"** di halaman struk
  (`/transactions/:id`) atau riwayat (`sales-buyback-history.md`, kalau sudah dikerjakan) — dari sisi
  API kedua jenis item balik dengan shape response yang **identik** (`stock_item_id`/`barcode`
  tetap ada, sengaja dibuat begitu backend supaya tidak perlu logic khusus di FE manapun). Kalau
  nanti client minta bisa dibedain visualnya, itu perubahan terpisah (butuh field baru dari
  backend dulu, response sekarang tidak expose "apakah item ini manual").
- **Tidak ada opsi restore/undo "jadikan manual lagi"** — begitu ditambahkan ke keranjang, item
  manual diperlakukan identik dengan item scan (bisa dihapus dari keranjang seperti biasa sebelum
  checkout, tapi tidak ada mode edit-ulang-produk/kondisi setelah ditambahkan — hapus lalu tambah
  ulang kalau salah input, sama seperti pola `AddBuybackItemDialog` sekarang).
- **Tidak ada perubahan di `/api/reports/finance` atau halaman laporan manapun** — laba item manual
  otomatis kehitung di sana tanpa perubahan kode laporan (itu justru inti desain backend-nya).

## Role & akses

Sama seperti checkout `SELL`/`SELL_SUPPLIER` yang sudah ada — **semua role yang login (termasuk
KASIR)** bisa akses halaman Penjualan dan pakai fitur input manual ini. Tidak ada pembatasan role
baru.

---

## Dokumentasi API

### `POST /api/transactions` — item manual (field baru)

Item `SELL`/`SELL_SUPPLIER` sekarang punya 2 mode, dibedain dari ada/tidaknya `stock_item_id`:

```json
// Mode scan (SUDAH ADA, tidak berubah) — item hasil scan barcode
{ "stock_item_id": "<public_id unit>", "price_total": 1500000, "confirmed": false }
```
```json
// Mode manual (BARU) — stock_item_id KOSONG, product_id diisi sebagai gantinya
{
  "product_id": "<public_id produk>",
  "serial_number": "MANUAL-0001",
  "condition": "GOOD",
  "cost_total": 900000,
  "price_total": 1500000,
  "confirmed": false,
  "production_year": 2024
}
```

Field mode manual (semua field ini **kosong/tidak dikirim** untuk item mode scan):
- `product_id` — wajib, produk katalog (dari `PickProductDialog` yang sudah ada di app). 404 kalau
  tidak ditemukan, 400 kalau produknya sudah diarsipkan.
- `serial_number` — wajib, string bebas (bukan hasil scan) → 422 kalau kosong. Harus unik terhadap
  unit `AVAILABLE` lain yang ada di DB **dan** terhadap item manual lain dalam batch yang sama → 409
  kalau bentrok, pesan `"serial_number sudah dipakai"`.
- `condition` — wajib `GOOD`/`BAD` → 422 kalau kosong/nilai lain.
- `cost_total` — wajib > 0 → 422 kalau tidak. Ini **harga modal** unit itu (dipakai backend buat
  hitung cogs/laba) — beda dari `price_total` yang harga jualnya.
- `production_year` — opsional, aturan sama dengan buyback (kalau diisi harus 2000 s.d. tahun
  berjalan+1 → 422 kalau di luar itu).
- `price_total` — wajib > 0, **field yang sudah ada**, dipakai sama persis seperti mode scan (harga
  jual unit, bukan per gram).
- `confirmed` — **field yang sudah ada**, cuma relevan kalau `condition: "BAD"` **dan** tipe
  transaksi `SELL` (bukan `SELL_SUPPLIER`) — sama aturan dengan mode scan yang sudah ada di FE
  sekarang (`ConfirmBadConditionDialog`).

Kalau `stock_item_id` **dan** `product_id` sama-sama diisi (atau sama-sama kosong) di satu item →
`400`:
```json
{"success":false,"error":{"code":"BAD_REQUEST","message":"item tidak boleh mengisi stock_item_id dan product_id sekaligus"}}
```

Error tambahan yang perlu ditangani (selain yang sudah ada buat mode scan):
```json
// 422 — field unit-creating item manual kosong/invalid
{"success":false,"error":{"code":"UNPROCESSABLE_ENTITY","message":"serial_number wajib diisi untuk item manual"}}
{"success":false,"error":{"code":"UNPROCESSABLE_ENTITY","message":"condition wajib diisi dan harus GOOD atau BAD untuk item manual"}}
{"success":false,"error":{"code":"UNPROCESSABLE_ENTITY","message":"cost_total item manual harus lebih besar dari 0"}}

// 409 — serial_number bentrok (unit lain yang AVAILABLE, atau item manual lain di batch yang sama)
{"success":false,"error":{"code":"CONFLICT","message":"serial_number sudah dipakai"}}

// 404 — product_id tidak ditemukan
{"success":false,"error":{"code":"NOT_FOUND","message":"produk tidak ditemukan"}}

// 400 — produk sudah diarsipkan
{"success":false,"error":{"code":"BAD_REQUEST","message":"produk sudah diarsipkan, tidak bisa dijual manual"}}
```

Response (`201`) **tidak berubah bentuknya** — item manual balik dengan `stock_item_id`/`barcode`/
`serial_number` terisi normal (unit-nya beneran dibuat di DB, cuma tidak pernah kelihatan
`AVAILABLE` di response lain manapun karena langsung dijual dalam transaksi yang sama). Tidak ada
field baru di response yang menandai "item ini manual" — lihat catatan di "Out of scope" di atas.

---

## Rencana implementasi FE

### 1. Store — `src/store/sell-cart-store.ts`

`SellCartLine` sekarang perlu 2 varian. Ubah jadi discriminated union (`kind`), sejajar
`BuybackItemLine`/`BuybackProductRef` yang sudah ada di `buyback-cart-store.ts` buat variannya:

```ts
export interface SellCartScanLine {
  kind: 'scan'
  item: StockItemLookupResult
  unitPrice: string
  confirmed: boolean
}

export interface SellCartManualLine {
  kind: 'manual'
  localId: string // client-generated (crypto.randomUUID()), sama pola dengan BuybackItemLine.localId
  product: { id: string; name: string; sku: string; weight_gram: number }
  serialNumber: string
  condition: StockCondition
  costTotal: string
  productionYear: number | null
  unitPrice: string
  confirmed: boolean
}

export type SellCartLine = SellCartScanLine | SellCartManualLine
```

- `addItem` (existing, dipakai scan) tetap sama — set `kind: 'scan'` eksplisit.
- Tambah `addManualItem(item: Omit<SellCartManualLine, 'kind' | 'localId' | 'unitPrice' | 'confirmed'>, confirmed = false)`
  — pola `localId` sama seperti `useBuybackCartStore.addItem`.
- `removeItem`/`setUnitPrice` perlu terima baik `line.item.id` (scan) maupun `line.localId`
  (manual) — cara termudah: satu `removeLine(lineId: string)`/`setLineUnitPrice(lineId, value)` yang
  cocokin ke `kind === 'scan' ? line.item.id : line.localId` secara internal, dipanggil dengan id
  yang sama dari `DataTable`'s `getRowId`.

### 2. Dialog baru — `src/components/sell/add-manual-sell-item-dialog.tsx`

Copy struktur `src/components/buyback/add-buyback-item-dialog.tsx` (field product/serial/condition/
production_year sudah persis sama), dengan bedanya:
- Field harga di dialog ini judulnya **"Harga Modal"** (bukan "Harga Beli/Unit") — mengisi
  `costTotal`, bukan `unitPrice`. Harga jual (`unitPrice`) **tidak** diisi di dialog ini, diisi
  belakangan lewat kolom tabel keranjang (lihat poin 3).
- Terima prop `type: 'SELL' | 'SELL_SUPPLIER'` (dari `useSellCartStore`) — kalau `condition === 'BAD'`
  dan `type === 'SELL'`, tampilkan checkbox tambahan "Saya konfirmasi kondisi BAD sudah diinfokan ke
  pelanggan" yang wajib dicentang sebelum submit (validasi client-side, sejajar pengecekan
  `unit_price`/`product` yang sudah ada di dialog buyback) — nilainya inilah yang jadi `confirmed`
  waktu di-`addManualItem`.
- Submit sukses → `useSellCartStore.getState().addManualItem(...)`, form direset, dialog **tetap
  terbuka** (pola sama dengan `AddBuybackItemDialog` — kasir bisa tambah beberapa item manual
  berturut-turut).

### 3. Halaman — `src/pages/sell-page.tsx`

- Tombol baru "Tambah Item Manual" (`variant="secondary"`, ikon `Plus`) di kartu scan barcode atau
  sejajar judul "Keranjang" (posisi persis terserah desain — yang penting jelas terpisah dari flow
  scan). Buka `AddManualSellItemDialog`.
- Kolom tabel keranjang (`columns` array) perlu baca dari `line.kind`:
  - `product` → `line.kind === 'scan' ? line.item.product.name : line.product.name` (sama pola untuk
    `barcode`/SN: manual belum tentu punya barcode dari FE — barcode baru ada setelah transaksi
    submit, response `POST` yang punya; sebelum itu tampilkan `line.serialNumber` saja tanpa
    barcode, atau label "Belum ada barcode" kalau perlu eksplisit).
  - `condition` → `line.kind === 'scan' ? line.item.condition : line.condition`.
  - `weight` → `line.kind === 'scan' ? line.item.product.weight_gram : line.product.weight_gram`.
  - `purchase_price` ("Harga Modal", read-only) → `line.kind === 'scan' ? line.item.purchase_price : Number(line.costTotal)`.
  - `unit_price` ("Harga/Unit", editable Input) → **field yang sama dipakai kedua kind**, cuma
    handler `onChange`-nya manggil `setLineUnitPrice(rowId, digits)` (poin 1) alih-alih
    `setUnitPrice(stockItemId, digits)` langsung.
  - `getRowId` → `(line) => line.kind === 'scan' ? line.item.id : line.localId`.
- `handleCheckout` — `items` yang dikirim ke `POST /transactions` sekarang map dari kedua kind:
  ```ts
  items: lines.map((line) =>
    line.kind === 'scan'
      ? { stock_item_id: line.item.id, price_total: lineTotal(line), ...(line.confirmed ? { confirmed: true } : {}) }
      : {
          product_id: line.product.id,
          serial_number: line.serialNumber,
          condition: line.condition,
          cost_total: Number(line.costTotal),
          production_year: line.productionYear,
          price_total: lineTotal(line),
          ...(line.confirmed ? { confirmed: true } : {}),
        },
  )
  ```
- `revalidateCartAfterError` (re-cek status unit lewat `GET /stock-items/{id}` tiap kali checkout
  gagal) **cuma relevan buat baris `kind: 'scan'`** — unit manual belum ada `stock_item_id` sampai
  submit berhasil, jadi tidak ada yang bisa di-refetch untuk baris itu. Filter `staleLines` ke
  `line.kind === 'scan'` sebelum loop, baris manual dibiarkan apa adanya di keranjang (kasir cukup
  perbaiki input & submit ulang kalau error-nya soal item manual, mis. 409 serial bentrok).

---

## Acceptance Criteria

- [ ] Tombol "Tambah Item Manual" muncul di halaman Penjualan (`/sell`), buka dialog form (produk,
      serial number, kondisi, harga modal, tahun produksi opsional).
- [ ] Item manual yang ditambahkan muncul di tabel keranjang yang sama dengan item hasil scan,
      dengan kolom yang konsisten (produk, kondisi, berat, harga modal, harga/unit editable,
      subtotal).
- [ ] Satu transaksi bisa berisi campuran item scan + manual → checkout sukses, struk menampilkan
      semua item dengan benar (termasuk `barcode` unit manual yang baru dibuat).
- [ ] Kondisi `BAD` + tipe `SELL` (ke pelanggan) tanpa konfirmasi → submit item ke keranjang
      diblokir/ditandai perlu konfirmasi; setelah dikonfirmasi → masuk keranjang. Tipe
      `SELL_SUPPLIER` tidak pernah minta konfirmasi ini.
- [ ] `serial_number` kosong / `cost_total` <= 0 / kondisi tidak dipilih → error ditampilkan di
      dialog, tidak bisa submit.
- [ ] `serial_number` yang sudah dipakai (409 dari server, dicoba pas checkout) → error jelas
      ditampilkan ke kasir, bukan crash/silent fail.
- [ ] Laba item manual (harga jual dikurangi harga modal yang diinput) muncul benar di
      `GET /api/reports/finance` (SUPER_ADMIN) — cek manual lewat halaman Laporan Keuangan yang
      sudah ada, **tanpa perubahan kode** di halaman itu.
- [ ] Halaman Buyback (`/buyback`) tidak berubah perilakunya sama sekali dibanding sebelum tiket
      ini — regresi check.
- [ ] Kasir bisa menambahkan beberapa item manual berturut-turut tanpa perlu menutup-buka dialog
      ulang (dialog tetap terbuka setelah tiap "Tambah Item").
