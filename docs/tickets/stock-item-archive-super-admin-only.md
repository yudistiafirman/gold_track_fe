# Arsipkan Unit Stok Dibatasi ke SUPER_ADMIN Saja

> Belum ada nomor tiket resmi (FE-XXXX) — sesuaikan dengan penomoran di tracker internal saat
> diimport. Backend sudah selesai, sudah dites (e2e), tidak butuh migration (perubahan role guard
> di endpoint yang sudah ada, bukan endpoint baru).

## Latar belakang

`DELETE /api/stock-items/{id}` (arsipkan unit stok — soft-delete, `status -> ARCHIVED`) tadinya
sekelas dengan `POST`/`PUT` unit stok lain, `ADMIN` & `SUPER_ADMIN` sama-sama bisa. Client minta
dipersempit: **cuma `SUPER_ADMIN` yang boleh mengarsipkan**, `ADMIN` sekarang dapat 403 kalau coba.
`Create`/`Update` unit stok (`POST`/`PUT`) **tidak berubah** — `ADMIN` masih bisa keduanya, cuma
`Delete` yang naik tier.

Backend sudah live: nested `RequireRole("SUPER_ADMIN")` khusus di route `DELETE
/api/stock-items/{id}`, di atas group `ADMIN`/`SUPER_ADMIN` yang sama dengan route lain di resource
ini — jadi kalau `ADMIN` sekarang hit tombol Arsipkan, responsnya `403 FORBIDDEN` (bukan lagi 200).

## Scope

**In scope:**
- Tombol "Arsipkan" di tab Unit Stok (`src/components/products/stock-items-tab.tsx`, dalam
  halaman detail produk) — disembunyikan buat role `ADMIN`, tetap tampil buat `SUPER_ADMIN`.

**Out of scope:**
- Tombol "Edit" (`PUT`) di tab yang sama — **tidak berubah**, `ADMIN` tetap bisa edit unit stok.
- Tombol "Tambah Unit Stok" (`POST`) — **tidak berubah**, `ADMIN` tetap bisa create.
- Halaman/komponen lain — sudah dicek, `useCan('delete', 'stock-items')` cuma dipakai di satu
  tempat (`stock-items-tab.tsx`), tidak ada trigger arsipkan unit stok di tempat lain.

## Role & akses

Ini murni penyempitan permission di FE, mengikuti pola yang sudah ada di `src/lib/permissions.ts`
— resource `stock-items` sekarang butuh entry eksplisit di `RESOURCE_OVERRIDES` (sebelumnya tidak
ada, jadi fallback ke default `ADMIN_ROLES` buat semua action termasuk `delete`).

## Dokumentasi API

Tidak ada perubahan shape response — cuma status code yang berubah buat role `ADMIN`:

```
DELETE /api/stock-items/{id}
- SUPER_ADMIN: 200 (sukses arsipkan, sama seperti sebelumnya) / 404 / 409 — tidak berubah
- ADMIN:       403 FORBIDDEN (baru — sebelumnya 200)
- KASIR:       403 FORBIDDEN — tidak berubah, dari dulu memang tidak punya akses
```

## Rencana implementasi FE

Satu-satunya perubahan kode: tambah entry `stock-items` di `RESOURCE_OVERRIDES`
(`src/lib/permissions.ts`), pakai konstanta `SUPER_ADMIN_ROLES` yang sudah ada di
`src/config/nav.ts` (dipakai juga buat gating menu Reports/Balance Accounts — resource lain yang
sudah `SUPER_ADMIN`-only):

```ts
import { ADMIN_ROLES, SUPER_ADMIN_ROLES } from '@/config/nav'

const RESOURCE_OVERRIDES: Partial<Record<string, Partial<Record<Action, Role[]>>>> = {
  customers: {
    create: ['ADMIN', 'KASIR', 'SUPER_ADMIN'],
  },
  'stock-items': {
    delete: SUPER_ADMIN_ROLES,
  },
}
```

Tidak ada perubahan lain yang dibutuhkan — `stock-items-tab.tsx` sudah manggil `useCan('delete',
'stock-items')` buat nge-gate tombol "Arsipkan" (baris ~74, ~170-189), jadi begitu
`RESOURCE_OVERRIDES` di-update, tombolnya otomatis hilang buat `ADMIN` tanpa sentuh file itu sama
sekali.

Catatan dari komentar yang sudah ada di `permissions.ts`: gating ini **cuma kontrol tampilan UI**,
backend `RequireRole` tetap jadi guard sebenarnya — jadi walau ada bug di FE yang bikin tombol
kepencet, request-nya tetap ditolak 403 oleh backend.

## Acceptance Criteria

- [ ] Login sebagai `ADMIN`, buka detail produk → tab Unit Stok → tombol "Arsipkan" di menu aksi
      **tidak muncul** untuk unit manapun (termasuk yang statusnya `AVAILABLE`).
- [ ] Login sebagai `SUPER_ADMIN`, buka halaman yang sama → tombol "Arsipkan" **tetap muncul**
      seperti sebelumnya (disabled kalau unit bukan `AVAILABLE`, sama seperti sekarang).
- [ ] Tombol "Edit" dan "Tambah Unit Stok" — **tidak ada perubahan** untuk `ADMIN` maupun
      `SUPER_ADMIN`.
- [ ] `KASIR` — tidak ada perubahan, dari dulu tidak punya akses ke tab Unit Stok sama sekali
      (halaman produk itu sendiri sudah admin-only).
