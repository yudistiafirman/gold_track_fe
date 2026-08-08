# Arsipkan Unit Stok (Archive Stock Item)

> Belum ada nomor tiket resmi (FE-XXXX) — sesuaikan dengan penomoran di tracker internal saat
> diimport. Backend sudah selesai, sudah dites (e2e), dan migration-nya sudah live di database.
> Tiket ini berkaitan erat dengan `cancel-transaction.md` (lihat bagian "Interaksi dengan cancel
> transaksi" di bawah) — kalau dua-duanya dikerjakan, cek juga catatan `[UPDATE 2026-08-08]` di
> tiket itu.

## Latar belakang

Client komplain gak bisa hapus unit stok padahal unitnya masih `AVAILABLE` (belum pernah terjual).
Penyebabnya: `DELETE /api/stock-items/{id}` sebelumnya hard-delete beneran, dan gagal kalau unit itu
masih direferensikan baris lain (unit hasil `BUY`/buyback yang belum terjual lagi, atau unit yang
pernah discan di sesi stock opname) — Postgres nolak di level foreign key.

Solusinya: `DELETE` sekarang **soft-delete lewat status**, bukan hapus baris beneran. Unit yang
diarsipkan statusnya jadi `ARCHIVED`, barisnya tetap ada permanen di database (sama seperti unit
`SOLD` yang juga gak pernah dihapus, demi histori transaksi/laporan tetap utuh).

**Bonus scope dari sesi yang sama**: unit yang sudah `SOLD` sekarang **juga bisa** diarsipkan (bukan
cuma `AVAILABLE`) — client kemungkinan bakal minta ini juga nantinya (mau declutter daftar unit dari
unit yang udah lama terjual). Unit `VOID` (hasil cancel buyback, lihat `cancel-transaction.md`)
**tetap tidak bisa** diarsipkan — statusnya sengaja dipertahankan `VOID` biar jelas alasannya
"buyback-nya dibatalkan", bukan "sengaja diarsipkan admin".

## Scope

**In scope:**
- Tombol hapus/arsipkan unit stok yang sudah ada (kemungkinan di `stock-items-tab.tsx` atau halaman
  detail unit — cek nama komponen persis di codebase, belum tentu sama dengan yang disebut di sini)
  — copy dan confirm dialog-nya perlu ditinjau ulang, karena ini **bukan lagi hapus permanen**.
  Saran copy: "Unit akan diarsipkan dan disembunyikan dari daftar. Data tetap tersimpan untuk
  keperluan histori." — bukan "akan dihapus permanen" (sudah tidak akurat).
- Kalau tombol arsip/hapus saat ini cuma muncul untuk unit `AVAILABLE`, pertimbangkan juga
  dimunculkan untuk unit `SOLD` (backend sekarang mengizinkan) — ini keputusan desain/produk, bukan
  keharusan teknis; koordinasi dengan PM/desainer kalau mau expose ini.
- Badge status baru: `ARCHIVED` harus tampil dengan tone yang benar di semua tempat yang menampilkan
  `StatusBadge` untuk unit stok (tab stock items produk, hasil pencarian/lookup kalau ditampilkan di
  situ, dst) — **kalau tidak ditambahkan, badge tetap jalan tapi fallback ke abu-abu polos tanpa
  error** (pola yang sama seperti disebut di `cancel-transaction.md`), jadi bukan blocker teknis
  tapi tetap harus dikerjakan biar konsisten.
- Kalau ada kode FE yang secara spesifik menangani error 409 lama
  `"unit stok sudah tercatat di transaksi atau stock opname, tidak bisa dihapus"` (mis. toast/copy
  khusus) — itu sekarang **tidak akan pernah muncul lagi** (kasus itu sekarang berhasil, bukan
  ditolak). Boleh dibersihkan, tapi juga aman dibiarkan sebagai dead code kalau gak sempat.

**Out of scope (sengaja tidak ada, jangan ditambahin di FE juga):**
- **Tidak ada endpoint restore/unarchive.** Sekali unit diarsipkan, gak ada API buat balikin
  statusnya ke `AVAILABLE`/`SOLD` secara langsung. Jangan bikin tombol "Batalkan Arsip" — itu belum
  didukung backend. Satu-satunya jalan unit `ARCHIVED` balik "hidup" adalah kalau dia `SOLD` lalu
  diarsipkan lalu transaksi penjualannya di-cancel (lihat bagian di bawah) — itu efek samping cancel
  transaksi, bukan fitur restore yang berdiri sendiri.
- Filter dropdown status stock items **tidak wajib** ditambah opsi `ARCHIVED`/`VOID` — backend
  sekarang mendukung `?status=ARCHIVED` dan `?status=VOID` sebagai query, tapi ini opsional/nice-to-
  have (mis. buat tab "Diarsipkan" kalau memang dibutuhkan tim). Tanpa filter itu pun aplikasi tetap
  jalan normal — unit archived/void cuma gak kelihatan di list default (lihat di bawah).

## Role & akses

Sama seperti endpoint stock-items lain yang destructive — **ADMIN + SUPER_ADMIN** saja, `KASIR`
ditolak `403`. Tidak berubah dari sebelumnya.

---

## Dokumentasi API

### `DELETE /api/stock-items/{id}`

```
DELETE /api/stock-items/{id}   (tanpa body)   -> 200 / 403 / 404 / 409
```

Response `200`:
```json
{"success": true, "data": {"message": "unit stok diarsipkan"}}
```

**Yang berubah dari sebelumnya:**
- Unit `AVAILABLE` **maupun** `SOLD` sekarang bisa diarsipkan (sebelumnya cuma `AVAILABLE`). Unit
  `SOLD` yang diarsipkan tetap menyimpan `sold_at`-nya apa adanya — cuma `status` yang berubah.
- Unit `AVAILABLE` yang masih direferensikan transaksi (`BUY`) atau sesi stock opname sekarang
  **berhasil** diarsipkan (200) — ini yang jadi akar komplain client, sekarang sudah beres.
- `GET /api/stock-items/{id}` setelah `DELETE` **tetap 200** (bukan 404 lagi seperti hard delete
  dulu) — respons `status`-nya jadi `"ARCHIVED"`. Kalau ada kode FE yang expect 404 setelah delete
  buat konfirmasi "sudah kehapus", itu perlu diganti cek `status === "ARCHIVED"` dari respons
  `DELETE`/refetch, bukan expect 404.

Error cases:
```json
// 403 — role KASIR
{"success":false,"error":{"code":"FORBIDDEN","message":"Anda tidak memiliki akses untuk aksi ini"}}

// 404 — id tidak ditemukan / format id salah
{"success":false,"error":{"code":"NOT_FOUND","message":"unit stok tidak ditemukan"}}

// 409 — unit VOID (hasil buyback yang dibatalkan) tidak bisa diarsipkan
{"success":false,"error":{"code":"CONFLICT","message":"unit sudah void (dibatalkan), tidak bisa diarsipkan"}}

// 409 — unit sudah diarsipkan sebelumnya (klik dobel / dua tab)
{"success":false,"error":{"code":"CONFLICT","message":"unit sudah diarsipkan sebelumnya"}}
```
Semua pesan di atas aman ditampilkan apa adanya lewat `showErrorToast`, tidak perlu logic tambahan
buat bedain kasusnya — sama seperti pola cancel transaksi.

### Field yang berubah di resource lain

- `GET /api/stock-items/{id}` dan list stock items — field `status` sekarang bisa bernilai
  `"ARCHIVED"` selain `"AVAILABLE"`/`"SOLD"`/`"VOID"` yang sudah ada.
- `GET /api/products/{productId}/stock-items` (list) — **tanpa** `?status=`, sekarang menyembunyikan
  unit `ARCHIVED` **dan** `VOID` dari hasil (sebelumnya semua status ikut muncul tanpa filter). Kalau
  FE menampilkan daftar unit stok tanpa filter status secara default (kemungkinan besar iya), unit
  yang baru diarsipkan otomatis hilang dari tampilan itu **tanpa perlu logic tambahan di FE** — ini
  yang bikin "arsipkan" terasa seperti "hapus dari daftar" ke user, meski datanya tetap ada.
  Eksplisit `?status=ARCHIVED` atau `?status=VOID` tetap bisa narik masing-masing kalau suatu saat
  dibutuhkan (mis. tab audit).

### Interaksi dengan cancel transaksi (`cancel-transaction.md`)

**Cancel transaksi selalu menang atas archive.** Kalau unit yang `SOLD` diarsipkan, terus transaksi
penjualannya (`SELL`/`SELL_SUPPLIER`) di-cancel lewat `POST /api/transactions/{id}/cancel` — cancel
itu **tetap berhasil** dan unitnya otomatis balik ke `AVAILABLE`, nge-overwrite status `ARCHIVED`-nya
tanpa error apapun. Sama halnya buat unit hasil `BUY` yang diarsipkan lalu BUY-nya di-cancel → balik
jadi `VOID`. Ini disengaja: cancel = membatalkan efek transaksi, jadi archive yang nempel di
tengah-tengah bukan alasan buat nolak cancel.

**Konsekuensi buat FE**: kalau ada tampilan yang nunjukin badge "Diarsipkan" di suatu unit, terus di
tempat lain ada yang cancel transaksi penjualan unit itu, badge-nya bakal berubah balik jadi
"Tersedia" tanpa ada aksi "buka arsip" eksplisit dari siapa pun. Ini perilaku backend yang sengaja
(lihat "Out of scope" di atas soal gak ada endpoint restore) — gak perlu penanganan khusus di FE,
cukup dipastikan halaman yang nampilin status unit itu refetch/invalidate query yang benar setelah
cancel (biasanya sudah otomatis kalau ngikutin pola `onSuccess` di `cancel-transaction.md`).

---

## Rencana implementasi FE

### 1. Domain status — `src/lib/domain-status.ts`
Tambah 1 entry ke `STOCK_STATUS_TONE` (lihat juga catatan `[UPDATE 2026-08-08]` di
`cancel-transaction.md` soal urutan pengerjaan dua tiket ini):

```ts
export const STOCK_STATUS_TONE = {
  AVAILABLE: 'success',
  SOLD: 'gray',
  VOID: 'gray',
  ARCHIVED: 'gray', // baru — samain tone-nya sama status "mati" lain, kecuali desainer minta beda
} as const satisfies Record<string, StatusTone>
```

### 2. Tombol hapus/arsipkan unit stok
Cari komponen yang sekarang manggil `DELETE /api/stock-items/{id}` (kemungkinan di
`stock-items-tab.tsx` atau komponen detail unit). Update:
- Copy confirm dialog — jangan lagi bilang "dihapus permanen", ganti jadi bahasa "diarsipkan".
- Kondisi tombolnya muncul — cek apakah sekarang di-gate cuma buat `status === 'AVAILABLE'`; kalau
  iya, diskusikan sama PM/desainer apakah mau dibuka juga buat `SOLD` (backend sudah support).
- `onSuccess` — invalidate query list stock items produk terkait biar unit yang baru diarsipkan
  otomatis hilang dari tampilan (list default backend sudah nyaring `ARCHIVED`, FE cuma perlu
  refetch).

### 3. (Opsional) Filter status
Kalau tim mau bikin cara buat lihat unit yang diarsipkan (mis. tab "Diarsipkan" di halaman produk),
tambah opsi `ARCHIVED` (dan/atau `VOID`) di filter dropdown stock items, manggil
`?status=ARCHIVED`/`?status=VOID`. Ini murni opsional, gak ada acceptance criteria yang mensyaratkan
ini.

---

## Acceptance Criteria

- [ ] Tombol arsipkan unit stok tersedia untuk unit `AVAILABLE`, hanya untuk role `ADMIN`/
      `SUPER_ADMIN`.
- [ ] Konfirmasi arsipkan unit `AVAILABLE` yang **belum pernah** tercatat di transaksi/opname →
      sukses, toast muncul, unit hilang dari list default.
- [ ] Konfirmasi arsipkan unit `AVAILABLE` yang **sudah** tercatat di transaksi `BUY` atau sesi
      stock opname → **sukses juga** (ini fix utama dari komplain client — pastikan gak ada 409
      lagi buat kasus ini).
- [ ] Coba arsipkan unit yang sudah `ARCHIVED` sebelumnya → toast error dari backend ("unit sudah
      diarsipkan sebelumnya"), tidak crash.
- [ ] Coba arsipkan unit `VOID` (kalau ada jalan buat expose ini di UI) → toast error dari backend
      ("unit sudah void (dibatalkan), tidak bisa diarsipkan"), tidak crash.
- [ ] Unit stok berstatus `ARCHIVED` tampil dengan badge yang benar (tidak blank/error) di tab stock
      items produk.
- [ ] Setelah unit diarsipkan, `GET` detail unit itu tetap bisa diakses (200) dan menampilkan status
      `ARCHIVED` — bukan halaman "tidak ditemukan".
- [ ] Role `KASIR` tidak melihat/tidak bisa memicu tombol arsipkan (backend balikin 403 kalau
      dipaksa lewat API langsung).
- [ ] (Kalau berlaku) Unit `SOLD` yang diarsipkan lalu transaksi penjualannya di-cancel → status
      unit otomatis balik `AVAILABLE` di tampilan, tanpa perlu aksi "buka arsip" manual.
