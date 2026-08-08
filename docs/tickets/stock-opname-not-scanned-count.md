# Tampilkan Jumlah Unit Belum Discan Sebelum Opname Diselesaikan

> Belum ada nomor tiket resmi (FE-XXXX) — sesuaikan dengan penomoran di tracker internal saat
> diimport. Backend sudah selesai, sudah dites (e2e), field baru **aditif** (tidak mengubah/menghapus
> field yang sudah ada di `GET /api/stock-opnames/{id}` atau `POST /{id}/scan`).

## Latar belakang

Komplain client: saat opname, "missing" (unit `AVAILABLE` yang belum discan) baru ketahuan **setelah**
menekan "Selesaikan Opname" — dan begitu ditekan, sesi langsung `COMPLETED` dan tidak bisa dilanjutkan
scan lagi. Kalau ternyata masih ada unit fisik yang kelewat, satu-satunya jalan adalah bikin sesi
opname baru dari awal (scan ulang semua unit yang sudah pernah discan juga), karena `stock_opnames`
memang cuma boleh punya 1 sesi `IN_PROGRESS` dan tidak ada endpoint "reopen".

Fix-nya di backend: sekarang ada info berapa unit `AVAILABLE` yang **masih belum discan**, tersedia
**sebelum** `complete` dipanggil — baik lewat `GET /api/stock-opnames/{id}` maupun langsung di response
tiap `POST /{id}/scan`. Tugas FE: tampilkan angka ini di layar scan (`scan-opname-page.tsx`) supaya
user tahu progresnya secara real-time, dan idealnya kasih peringatan kalau mau menyelesaikan padahal
masih ada yang belum discan.

## Scope

**In scope:**
- Field baru `not_scanned` di `summary` (`GET /api/stock-opnames/{id}`) dan di root response
  `POST /{id}/scan` — update type di `src/types/stock-opname.ts`.
- Stat tile baru "Belum Discan" di `scan-opname-page.tsx`, di samping tile Total Discan/Match/
  Unexpected yang sudah ada — nilainya di-seed dari `GET` awal, lalu update tiap kali `scan` sukses
  (sama pola dengan state `counts` yang sudah ada di komponen itu, tinggal tambah 1 field lagi).
- Peringatan sebelum "Selesaikan Opname" kalau `not_scanned > 0` — minimal konfirmasi dialog
  ("Masih ada N unit yang belum discan. Yakin ingin menyelesaikan opname? Unit yang belum discan akan
  otomatis tercatat sebagai MISSING.") sebelum benar-benar memanggil `POST /{id}/complete`. Ini bagian
  paling penting dari fix ini — tanpa ini, user masih bisa kepencet selesai tanpa sadar.

**Out of scope:**
- Tidak ada endpoint baru buat **melihat daftar** unit yang belum discan (barcode/nama produk-nya)
  sebelum complete — backend cuma expose **angka**-nya (`not_scanned`), bukan daftar unitnya, karena
  unit yang belum discan memang belum punya baris di `stock_opname_items` (tabel sumber untuk
  detail per-unit). Kalau ke depannya dibutuhkan daftar detailnya (bukan cuma angka), itu perlu
  endpoint backend terpisah — bukan bagian dari tiket ini.
- Tidak ada perubahan alur `complete` itu sendiri — dialog konfirmasi di atas murni tambahan di FE
  sebelum manggil API yang sudah ada, `POST /{id}/complete` masih jalan persis seperti sekarang.

## Role & akses

Tidak berubah — sama seperti endpoint `stock-opnames` lain, `ADMIN`/`SUPER_ADMIN` saja.

---

## Dokumentasi API

### `GET /api/stock-opnames/{id}` — field baru di `summary`

```json
{
  "success": true,
  "data": {
    "id": "...",
    "opname_code": "OPN-20260808-0001",
    "status": "IN_PROGRESS",
    "summary": { "match": 1, "missing": 0, "unexpected": 0, "not_scanned": 2 },
    "items": [ /* ... unchanged ... */ ]
  }
}
```

`not_scanned` = jumlah unit `stock_items.status = 'AVAILABLE'` yang **belum** punya baris di
`stock_opname_items` untuk sesi ini — persis yang bakal otomatis jadi `MISSING` kalau `complete`
dipanggil sekarang juga. Selalu `0` untuk sesi `COMPLETED` (unit yang tadinya belum discan sudah jadi
baris `MISSING` beneran di `items[]` begitu sesi selesai) dan juga selalu `0` di baris list header-only
(`GET /api/stock-opnames` tanpa `/{id}`) — sama seperti `match`/`missing`/`unexpected` yang di situ juga
selalu nol, angka aslinya cuma ada di endpoint detail.

### `POST /api/stock-opnames/{id}/scan` — field baru di root response

```json
{
  "success": true,
  "data": {
    "id": "...",
    "stock_item_id": "...",
    "barcode": "00000001",
    "product_name": "Emas Batangan 10gr",
    "system_status": "AVAILABLE",
    "physical_status": "FOUND",
    "result": "MATCH",
    "not_scanned": 2
  }
}
```

`not_scanned` di sini dihitung ulang **setelah** scan yang baru saja terjadi masuk — jadi kalau
sebelumnya `3` dan barcode yang baru discan itu `AVAILABLE`, hasilnya `2`. Ini yang dipakai buat update
tile "Belum Discan" secara live tanpa perlu `GET` ulang tiap habis scan.

Catatan: kalau unit yang discan **bukan** `AVAILABLE` (hasilnya `UNEXPECTED`, mis. unit yang sudah
`SOLD`/`ARCHIVED` tapi ternyata discan), `not_scanned` **tidak berubah** dari sebelumnya — unit itu
memang bukan bagian dari hitungan `AVAILABLE` yang belum discan.

Tidak ada perubahan pada status code atau error case yang sudah ada (400/404/409 sama persis).

---

## Rencana implementasi FE

### 1. Types — `src/types/stock-opname.ts`

```ts
export interface StockOpnameSummary {
  match: number
  missing: number
  unexpected: number
  not_scanned: number // baru
}

export interface ScanOpnameResult {
  id: string
  stock_item_id: string
  barcode: string
  product_name: string
  system_status: StockStatus
  physical_status: PhysicalStatus
  result: Extract<OpnameResult, 'MATCH' | 'UNEXPECTED'>
  not_scanned: number // baru
}
```

### 2. `scan-opname-page.tsx` — state & seed

Komponen ini sudah punya state lokal `counts = { match, unexpected }` yang di-seed dari
`opname.summary` lewat `useEffect` (lihat blok `if (!opname || seeded) return` di baris ~47-68), lalu
di-update tiap `scanMutation.onSuccess` (baris ~88-91). Tambah 1 field lagi ke state yang sama:

```ts
const [counts, setCounts] = useState({ match: 0, unexpected: 0, notScanned: 0 })
```

Seed:
```ts
setCounts({
  match: opname.summary.match,
  unexpected: opname.summary.unexpected,
  notScanned: opname.summary.not_scanned,
})
```

Update di `onSuccess` scan mutation — beda dari `match`/`unexpected` yang increment manual, `notScanned`
langsung dipakai dari response server apa adanya (server yang tahu angka pastinya, tidak perlu
dihitung sendiri di FE):
```ts
onSuccess: (result) => {
  setFeed((prev) => [...])
  setCounts((prev) => ({
    match: prev.match + (result.result === 'MATCH' ? 1 : 0),
    unexpected: prev.unexpected + (result.result === 'UNEXPECTED' ? 1 : 0),
    notScanned: result.not_scanned,
  }))
  // ...
}
```

### 3. Tile "Belum Discan"

Tambah 1 tile lagi di grid stat yang sudah ada (baris ~177-207, saat ini `sm:grid-cols-3` — jadi
`sm:grid-cols-4`), sebelum atau sesudah tile Unexpected — urutan bebas, saran taruh paling akhir biar
"progress ke penyelesaian" terbaca dari kiri ke kanan:

```tsx
<div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-card">
  <div>
    <p className="text-caption text-gray-500">Belum Discan</p>
    <p className="text-h2 tabular-nums text-gray-900">
      {counts.notScanned.toLocaleString('id-ID')}
    </p>
  </div>
  <div className="flex size-11 items-center justify-center rounded-full bg-gray-100">
    <ScanBarcode className="size-5 text-gray-400" />
  </div>
</div>
```

(Ganti ikon/warna sesuai preferensi desain — yang penting datanya, bukan visualnya persis seperti di
atas.)

### 4. Konfirmasi sebelum "Selesaikan Opname"

Tombol "Selesaikan Opname" (baris ~269-279) saat ini langsung `completeMutation.mutate()` tanpa
konfirmasi apapun. Tambah pengecekan `counts.notScanned > 0` sebelum langsung submit — pakai dialog
konfirmasi yang sudah ada polanya di codebase (cek komponen `AlertDialog`/`ConfirmDialog` yang dipakai
di halaman lain, mis. cancel transaksi/PO, biar konsisten):

```tsx
function handleCompleteClick() {
  if (counts.notScanned > 0) {
    setShowConfirmDialog(true) // buka dialog konfirmasi
    return
  }
  completeMutation.mutate()
}
```

Copy dialog contoh: *"Masih ada {counts.notScanned} unit yang belum discan. Unit yang belum discan
akan otomatis tercatat sebagai MISSING begitu opname diselesaikan. Yakin ingin melanjutkan?"* — tombol
konfirmasi tetap memanggil `completeMutation.mutate()` yang sama persis seperti sekarang, tidak ada
perubahan pada pemanggilan API-nya.

Kalau `counts.notScanned === 0`, behavior tetap seperti sekarang — langsung submit tanpa dialog
tambahan (tidak perlu ganggu alur yang memang sudah lengkap).

---

## Acceptance Criteria

- [ ] Layar scan opname (`scan-opname-page.tsx`) menampilkan tile "Belum Discan" dengan angka yang
      benar begitu halaman dibuka (di-seed dari `GET /{id}` awal).
- [ ] Setelah tiap scan sukses, angka "Belum Discan" update langsung dari response `scan` (tidak perlu
      refresh halaman atau fetch ulang manual) — turun 1 kalau unit yang discan `AVAILABLE`, tidak
      berubah kalau hasilnya `UNEXPECTED`.
- [ ] Membuka kembali sesi `IN_PROGRESS` yang sudah pernah discan sebagian (resume dari list) →
      angka "Belum Discan" langsung benar sejak awal, bukan `0`/salah sampai scan pertama terjadi.
- [ ] Klik "Selesaikan Opname" saat "Belum Discan" masih > 0 → muncul dialog konfirmasi yang
      menyebutkan jumlahnya, opname **tidak langsung selesai** sampai user konfirmasi.
- [ ] Klik "Selesaikan Opname" saat "Belum Discan" sudah 0 → langsung selesai seperti behavior
      sekarang, tanpa dialog tambahan.
- [ ] Setelah opname selesai (`opname-result-page.tsx`), tidak ada perubahan tampilan yang diharapkan
      di luar yang sudah ada — `not_scanned` di situ selalu `0`, tidak perlu ditampilkan sebagai tile
      terpisah di halaman hasil (bedanya cuma di layar scan yang masih `IN_PROGRESS`).
