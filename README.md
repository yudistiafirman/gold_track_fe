# GoldTrack — Frontend

FE untuk GoldTrack (toko emas): penjualan, buyback, stok, purchase order, opname, laporan.

## Stack

- [Vite](https://vite.dev) + React + TypeScript
- Routing: [React Router](https://reactrouter.com) (data router)
- Data fetching: [Axios](https://axios-http.com) + [TanStack Query](https://tanstack.com/query)
- State client-side (auth/UI): [Zustand](https://zustand.docs.pmnd.rs)
- UI: [Tailwind CSS](https://tailwindcss.com) v4 + [shadcn/ui](https://ui.shadcn.com) (Radix)
- Lint: [oxlint](https://oxc.rs)

## Setup

```bash
cp .env.example .env   # isi VITE_API_BASE_URL
npm install
npm run dev
```

Script lain: `npm run build`, `npm run lint`, `npm run preview`.

## Struktur folder

```
src/
  app/            router, query client, route guards (ProtectedRoute, RoleGuard)
  components/
    ui/           primitive shadcn (Button, Input, Table, Dialog, dst)
    layout/       shell aplikasi (sidebar, topbar, AppLayout)
    data-table/   DataTable generik (search, filter slot, pagination)
    ...           komponen reusable lain (FormField, ConfirmDialog, EmptyState, StatusBadge)
  config/         nav.ts — struktur menu sidebar + role per item
  lib/            api client, toast helper, domain-status mapping, util lain
  pages/          satu file per halaman/route
  store/          zustand store (auth)
  types/          tipe bersama (role, api envelope)
```

## Konvensi penting

**Auth & role.** Token + user (`id/name/email/role`) disimpan di `useAuthStore` (`src/store/auth-store.ts`), role: `ADMIN | KASIR | SUPER_ADMIN`. Route diproteksi via `ProtectedRoute` (butuh login) dan `RoleGuard` (butuh role tertentu) — lihat `src/app/router.tsx`. Menu sidebar & role guard sama-sama baca dari `src/config/nav.ts`, jangan hardcode role check di tempat lain.

**API client.** `src/lib/api/client.ts` — axios instance, base URL dari `VITE_API_BASE_URL`, auto-attach Bearer token, auto-unwrap envelope `{success,data}` / `{success:false,error:{code,message}}`. 401 → auto logout + redirect `/login`. 403 → redirect `/403`. Pakai `api.get/post/put/patch/delete`, bukan axios langsung.

**Pagination.** Sebagian besar endpoint list mengembalikan `{items:[...], pagination:{page,limit,total,total_pages}}` — ini bentuk yang diterima `DataTable` (`src/components/data-table`). Pengecualian: `GET /api/expense-categories` mengembalikan array polos; untuk endpoint begini, jangan kirim prop `pagination` ke `DataTable`.

**Toast.** Pakai `showSuccessToast` / `showErrorToast` dari `src/lib/toast.ts`, jangan panggil `toast()` dari `sonner` langsung — `showErrorToast` sudah tahu cara baca `error.message` dari `ApiError`.

**Design system.** Semua token warna/tipografi/spacing/radius ada di `src/index.css` sebagai CSS variable, didokumentasikan lengkap di [`docs/design-system.md`](docs/design-system.md) (termasuk blok prompt siap-tempel buat Google Stitch). Jangan hardcode hex/px di komponen — pakai utility Tailwind yang sudah di-theme (`bg-green-500`, `text-h1`, `rounded-lg`, dst).
