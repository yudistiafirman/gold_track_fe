# Rincian Unit Belum Discan di Stock Opname (List + Breakdown per Gramasi)

> Belum ada nomor tiket resmi (FE-XXXX) — sesuaikan dengan penomoran di tracker internal saat
> diimport. Backend sudah selesai, sudah dites (e2e), tidak butuh migration (endpoint lama yang
> di-extend, bukan endpoint baru).

## Latar belakang

Halaman Scan Opname (`/stock-opnames/{id}/scan`) sekarang cuma nampilin **angka** "Belum Discan" (mis.
"3") lewat `summary.not_scanned` — tidak ada cara tahu unit **mana saja** yang masih belum discan
tanpa langsung `complete` sesi (yang otomatis nutup sesi dan menandai semuanya `MISSING`). Client
minta dua hal tambahan:
1. Daftar unit yang belum discan, masing-masing dengan **gramasi** dan **kode emas** (SKU) — bukan
   cuma barcode/nama produk yang sudah ada di tabel Riwayat Scan.
2. Total emas yang belum discan **dipecah per gramasi**, bukan satu grand total — mis. "5 gram: 3
   unit (15 gram)", "10 gram: 1 unit (10 gram)", bukan "4 unit" gabungan yang tidak bisa langsung
   dicocokkan ke stok fisik (batangan 5gr dan 10gr bukan barang yang sama).

Backend sekarang extend response `GET /api/stock-opnames/{id}` **dan** `POST
/api/stock-opnames/{id}/scan` (keduanya cuma selagi sesi `IN_PROGRESS` — kosong lagi begitu
`COMPLETED`, sama seperti `not_scanned` balik ke `0`) dengan dua field baru:
- `not_scanned_items[]` — tiap unit `AVAILABLE` yang belum discan: `stock_item_id`, `barcode`,
  `sku`, `product_name`, `weight_gram`.
- `not_scanned_by_weight[]` — item yang sama dikelompokkan per `weight_gram`, urut menaik:
  `{weight_gram, count, total_weight_gram}`.

`summary.not_scanned` (angka) **tidak berubah** — tetap ada, cuma sekarang ditemani detailnya.

## Scope

**In scope:**
- Halaman Scan Opname (`src/pages/scan-opname-page.tsx`): kartu statistik "Belum Discan" yang sudah
  ada ditambah tombol/trigger buat buka dialog rincian, isinya:
  - Ringkasan per gramasi (`not_scanned_by_weight`) — mis. "5 gr — 3 unit (15 gr)".
  - Daftar tiap unit (`not_scanned_items`) — barcode, SKU, nama produk, gramasi.
  - Kedua bagian ini **update live** setiap habis scan (dari response `scan` itu sendiri, sama pola
    dengan `counts.notScanned` yang sudah ada — tidak fetch ulang `GET /{id}`), dan ke-seed dari
    `GET /{id}` saat halaman pertama dibuka / resume sesi `IN_PROGRESS`.
- Tipe baru di `src/types/stock-opname.ts` buat kedua field ini.

**Out of scope:**
- Halaman Hasil Opname (`src/pages/opname-result-page.tsx`) — field ini kosong begitu sesi
  `COMPLETED` (di titik itu unit yang tadinya "belum discan" sudah jadi baris `MISSING` beneran di
  `items[]`, yang sudah ditampilkan tabelnya di halaman itu), jadi **tidak ada perubahan** di sana.
- Halaman daftar sesi (`src/pages/stock-opnames-page.tsx`) — list header-only, `not_scanned` di situ
  selalu `0` (bukan angka asli), field baru ini juga tidak pernah keisi di endpoint list.
- Export/print daftar belum discan — kalau dibutuhkan, itu tiket terpisah.

## Role & akses

Tidak ada perubahan — halaman Scan Opname dari dulu sudah `ADMIN`/`SUPER_ADMIN` only (tidak ada
akses `KASIR` sama sekali di stock opname), field baru ini ikut response yang sudah dipanggil
halaman itu, jadi tidak ada penyesuaian role.

## Dokumentasi API

`GET /api/stock-opnames/{id}` dan `POST /api/stock-opnames/{id}/scan` — lihat `README.md` backend
bagian `### /api/stock-opnames` buat detail lengkap. Ringkasnya:

```jsonc
// GET /api/stock-opnames/{id} — sesi IN_PROGRESS
{
  "id": "...",
  "opname_code": "OPN-20260812-0001",
  "status": "IN_PROGRESS",
  "summary": { "match": 1, "missing": 0, "unexpected": 0, "not_scanned": 3 },
  "not_scanned_items": [
    { "stock_item_id": "...", "barcode": "00000002", "sku": "BTG-ANT-5-001", "product_name": "Emas Batangan 5gr", "weight_gram": 5 },
    { "stock_item_id": "...", "barcode": "00000003", "sku": "BTG-ANT-5-002", "product_name": "Emas Batangan 5gr", "weight_gram": 5 },
    { "stock_item_id": "...", "barcode": "00000004", "sku": "BTG-ANT-10-001", "product_name": "Emas Batangan 10gr", "weight_gram": 10 }
  ],
  "not_scanned_by_weight": [
    { "weight_gram": 5, "count": 2, "total_weight_gram": 10 },
    { "weight_gram": 10, "count": 1, "total_weight_gram": 10 }
  ]
  // ...items[], created_at, dst — tidak berubah
}
```

```jsonc
// POST /api/stock-opnames/{id}/scan — response scan tunggal, sama dua field ini ikut serta
{
  "id": "...", "stock_item_id": "...", "barcode": "00000001",
  "product_name": "Emas Batangan 10gr", "system_status": "AVAILABLE",
  "physical_status": "FOUND", "result": "MATCH",
  "not_scanned": 2,
  "not_scanned_items": [ /* sama shape di atas, minus yang baru discan */ ],
  "not_scanned_by_weight": [ /* grup yang bersangkutan otomatis turun count-nya */ ]
}
```

Begitu sesi `COMPLETED`, kedua field ini kosong (`[]`) di response `GET /{id}` — sama seperti
`not_scanned` balik ke `0`.

## Rencana implementasi FE

1. **`src/types/stock-opname.ts`** — tambah dua interface baru:
   ```ts
   export interface NotScannedItem {
     stock_item_id: string
     barcode: string
     sku: string
     product_name: string
     weight_gram: number
   }

   export interface NotScannedWeightGroup {
     weight_gram: number
     count: number
     total_weight_gram: number
   }
   ```
   Extend `StockOpnameDetail` dan `ScanOpnameResult` masing-masing dengan
   `not_scanned_items?: NotScannedItem[]` dan `not_scanned_by_weight?: NotScannedWeightGroup[]`
   (opsional — kosong/absen di sesi `COMPLETED` dan di endpoint list header-only).

2. **`src/components/stock-opnames/not-scanned-breakdown-dialog.tsx`** (baru) — dialog sederhana
   (pola `Dialog` yang sudah dipakai di komponen lain, mis. `add-buyback-item-dialog.tsx`), props
   `items: NotScannedItem[]`, `byWeight: NotScannedWeightGroup[]`, `open`/`onOpenChange`. Isinya dua
   bagian:
   - Ringkasan per gramasi di atas (list singkat: `{weight_gram} gr — {count} unit ({total_weight_gram} gr)`).
   - Daftar unit di bawah, scrollable kalau panjang — barcode, SKU, nama produk, gramasi per baris.
   Tidak perlu pagination/search server-side — jumlah unit belum discan dalam satu sesi opname wajar
   kecil (toko fisik, bukan ribuan baris), tapi tetap scrollable container biar tidak mendorong layout
   dialog kalau kebetulan banyak.

3. **`src/pages/scan-opname-page.tsx`**:
   - Extend state `counts` (atau state baru sejajar `counts`, mis. `notScannedDetail`) dengan
     `items: NotScannedItem[]` dan `byWeight: NotScannedWeightGroup[]`.
   - Di `useEffect` seed yang sudah ada (baris ~49-74) — tambah seed dari
     `opname.not_scanned_items`/`opname.not_scanned_by_weight` (fallback `[]` kalau `undefined`,
     mis. saat sesi ternyata bukan `IN_PROGRESS` walau harusnya tidak sampai kesitu karena halaman ini
     sudah nge-block non-`IN_PROGRESS` di baris ~137).
   - Di `scanMutation.onSuccess` (baris ~89-101) — tambah update dari
     `result.not_scanned_items`/`result.not_scanned_by_weight`, sejalan dengan update
     `notScanned: result.not_scanned` yang sudah ada.
   - Kartu statistik "Belum Discan" (baris ~222-232) — tambah tombol kecil/`onClick` di kartu itu
     buat buka `NotScannedBreakdownDialog` (disabled/hidden kalau `counts.notScanned === 0`, tidak
     ada gunanya buka dialog kosong).

## Acceptance Criteria

- [ ] Saat halaman Scan Opname pertama dibuka (sesi baru atau resume sesi `IN_PROGRESS`), kartu
      "Belum Discan" bisa diklik buat lihat rincian — ringkasan per gramasi + daftar unit, sesuai
      data dari `GET /{id}` saat itu.
- [ ] Setelah scan 1 unit, rincian (ringkasan per gramasi maupun daftar unit) langsung ter-update
      dari response `scan` itu sendiri — tanpa perlu tutup-buka dialog atau refresh halaman.
- [ ] Unit yang baru discan hilang dari daftar `not_scanned_items`, dan grup gramasinya berkurang 1
      (atau grup itu hilang seluruhnya kalau itu unit terakhir di gramasi tersebut).
- [ ] Kartu "Belum Discan" ter-disable/tersembunyi triggernya begitu `counts.notScanned === 0`.
- [ ] Halaman Hasil Opname (`opname-result-page.tsx`) — **tidak ada perubahan visual/behaviour**.
- [ ] Halaman daftar sesi (`stock-opnames-page.tsx`) — **tidak ada perubahan**.
