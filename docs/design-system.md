# GoldTrack Design System

Single source of truth for FE-000. Tema **terang**, aksen **hijau**, densitas **spacious**, font **Inter**.

Status: warna brand (hijau, scale 50–700) dan 4 warna semantic dasar (success/warning/error/info)
sudah disetujui client. Tint terang (`-100`) dan teks gelap (`-700`) untuk warning/error/gray badge
**belum** punya stop eksplisit dari client — diturunkan dari warna dasar yang sudah disetujui
(lihat catatan di §5). Update di sini kalau client kasih nilai pasti.

Implementasi kode: semua token hidup sebagai CSS custom properties di `src/index.css` (blok
`@theme inline` dan `:root`). Jangan hardcode hex di komponen — pakai utility Tailwind
(`bg-green-500`, `text-gray-700`, `bg-warning/10`, dst.) supaya kalau token berubah, cukup edit
satu file.

---

## 1. Warna

### Brand — hijau

| Token | Hex | Pakai untuk | Tailwind utility |
|---|---|---|---|
| green-50 | `#ECFDF3` | background halus, highlight baris | `bg-green-50` |
| green-100 | `#D1FADF` | badge sukses (bg) | `bg-green-100` |
| green-500 | `#12B76A` | aksen utama, tombol primary | `bg-green-500` |
| green-600 | `#039855` | hover tombol primary | `bg-green-600` |
| green-700 | `#027A48` | teks di atas bg hijau muda, active | `text-green-700` |

### Netral — abu-abu

| Token | Hex | Pakai untuk | Tailwind utility |
|---|---|---|---|
| white | `#FFFFFF` | surface kartu, background utama | `bg-white` |
| gray-50 | `#F9FAFB` | background halaman (page bg) | `bg-gray-50` |
| gray-100 | `#F2F4F7` | header tabel, hover baris | `bg-gray-100` |
| gray-200 | `#EAECF0` | border hairline default | `border-gray-200` |
| gray-300 | `#D0D5DD` | border input, divider tegas | `border-gray-300` |
| gray-500 | `#667085` | teks sekunder / placeholder | `text-gray-500` |
| gray-700 | `#344054` | teks label | `text-gray-700` |
| gray-900 | `#101828` | teks utama (heading, body) | `text-gray-900` |

### Semantic — status

| Token | Hex | Makna | Tailwind utility |
|---|---|---|---|
| success | `#12B76A` | sukses (nyatu sama brand) | `bg-success` / `text-success` |
| warning | `#F79009` | peringatan / low stock | `bg-warning` / `text-warning` |
| error | `#F04438` | gagal / destruktif | `bg-error` / `text-error` |
| info | `#2E90FA` | info netral | `bg-info` / `text-info` |

shadcn semantic slot mapping (dipakai otomatis oleh semua komponen `ui/*`):

| shadcn var | Nilai |
|---|---|
| `--background` | gray-50 |
| `--foreground` | gray-900 |
| `--card` / `--popover` | white |
| `--primary` | green-500 |
| `--primary-foreground` | white |
| `--secondary` | white |
| `--secondary-foreground` | gray-700 |
| `--muted` | gray-100 |
| `--muted-foreground` | gray-500 |
| `--accent` | green-50 |
| `--accent-foreground` | green-700 |
| `--destructive` | error |
| `--border` | gray-200 |
| `--input` | gray-300 |
| `--ring` | green-500 |

---

## 2. Tipografi

Family: **Inter** (fallback `system-ui, sans-serif`). Hanya pakai weight 400 (reguler), 500 (label/heading kecil), 600 (heading besar).

| Peran | Size | Weight | Line-height | Tailwind utility |
|---|---|---|---|---|
| Heading 1 | 28px | 600 | 1.3 | `text-h1` |
| Heading 2 | 22px | 600 | 1.35 | `text-h2` |
| Heading 3 | 18px | 500 | 1.4 | `text-h3` |
| Body | 15px | 400 | 1.6 | `text-body` |
| Body kecil / caption | 13px | 400 | 1.5 | `text-caption` |
| Label input | 14px | 500 | 1.4 | `text-label` |
| Angka tabel (mono opsional) | 15px | 500 | 1.5 | `text-table-num` |

Tiap utility di atas sudah bawa size + line-height + weight sekaligus (didefinisikan sebagai custom `--text-*` token di Tailwind v4).

---

## 3. Spacing (spacious)

Skala kelipatan 4px — sudah 1:1 dengan skala default Tailwind, tinggal pakai:

| px | Tailwind |
|---|---|
| 4 | `1` |
| 8 | `2` |
| 12 | `3` |
| 16 | `4` |
| 20 | `5` |
| 24 | `6` |
| 32 | `8` |
| 40 | `10` |
| 48 | `12` |
| 64 | `16` |

Aturan pakai:

- Padding dalam kartu: `p-6` (24px)
- Gap antar field form: `gap-5` (20px)
- Padding sel tabel: `py-3 px-4` (12px vertikal / 16px horizontal)
- Margin antar section di halaman: `my-8` / `space-y-8` (32px)

---

## 4. Radius, border, shadow

| Token | Nilai | Tailwind utility |
|---|---|---|
| radius-sm | 6px | `rounded-sm` (badge, input) |
| radius-md | 8px | `rounded-md` (tombol, kartu kecil) |
| radius-lg | 12px | `rounded-lg` (kartu, modal) |
| Border default | 1px gray-200 | `border border-border` |
| Border input | 1px gray-300, focus 1px green-500 + ring green-100 | `border-input focus-visible:border-ring focus-visible:ring-ring/50` |
| Shadow kartu | `0 1px 3px rgba(16,24,40,0.1)` | `shadow-card` |
| Shadow modal | `0 8px 24px rgba(16,24,40,0.12)` | `shadow-modal` |

---

## 5. Komponen dasar

Primitif kode: `src/components/ui/*` (shadcn), sudah otomatis ke-theme lewat token di atas — tidak
perlu override warna manual per halaman. Implementasi/wiring per fitur ada di FE-003; di sini cuma
spec visual + tempat primitifnya hidup.

| Komponen | Spec visual | Primitif kode |
|---|---|---|
| Button primary | bg green-500, teks putih, hover green-600, radius-md, padding 10px/16px, disabled opacity 0.5 | `Button` (`variant="default"`) |
| Button secondary | bg putih, border gray-300, teks gray-700, hover bg gray-50 | `Button` (`variant="secondary"`, sudah cocok krn `--secondary` = white) |
| Button danger | bg error, teks putih | `Button` (`variant="destructive"`) |
| Input | border gray-300, radius-sm, tinggi 40px, label gray-700 di atas, error di bawah | `Input` + `Label` (`text-label` utility) |
| Tabel | header bg gray-100 teks gray-500 uppercase 12px, border-bottom gray-200, hover baris gray-50 | `Table` |
| Badge/status | pill radius penuh, bg stop-100, teks stop-700 | `StatusBadge` (`src/components/status-badge.tsx`) — lihat §7 |
| Modal | kartu putih radius-lg, overlay `rgba(16,24,40,0.4)`, shadow modal | `Dialog` |
| Toast | pojok kanan atas, border kiri 4px sesuai status, ikon + pesan | `Toaster` (`src/components/ui/sonner.tsx`), dipasang di `App.tsx` |

**Catatan terbuka:** `success` badge pakai stop resmi (`green-100`/`green-700`). `warning`, `error`,
dan `gray` badge belum punya stop `-100`/`-700` eksplisit dari client, jadi dipakai `bg-{warna}/10`
+ `text-{warna}` (kecuali gray, yang sudah punya `gray-100`/`gray-700` resmi). Ganti begitu client
kasih hex pasti — cukup edit `toneClasses` di `status-badge.tsx`, tidak perlu ubah pemanggil.

---

## 6. Ikon

Icon set: **Lucide** (`lucide-react`, sudah terpasang). Warna icon ikut warna teks parent (`currentColor`, default Lucide).

| Konteks | Ukuran | Konstanta |
|---|---|---|
| Inline (dalam teks/badge) | 16px | `ICON_SIZE.inline` |
| Dalam tombol | 20px | `ICON_SIZE.button` |
| Maksimal | 24px | `ICON_SIZE.max` |

Constants ada di `src/lib/icon-size.ts`.

---

## 7. Status warna domain GoldTrack

Sumber kebenaran di kode: `src/lib/domain-status.ts` (map enum → tone) + `src/components/status-badge.tsx` (render). Semua modul (PO, stok, opname) wajib pakai `<StatusBadge>` ini, jangan bikin badge warna sendiri per halaman.

| Konteks | Nilai | Tone | Warna |
|---|---|---|---|
| PO | `BELUM_DITERIMA` | warning | kuning |
| PO | `DITERIMA` | success | hijau |
| PO | `DIBATALKAN` | gray | abu |
| Stok — status | `AVAILABLE` | success | hijau |
| Stok — status | `SOLD` | gray | abu |
| Stok — condition | `GOOD` | success | hijau |
| Stok — condition | `BAD` | warning | kuning |
| Stok — low stock | `low_stock=true` | error | merah |
| Opname — hasil | `MATCH` | success | hijau |
| Opname — hasil | `MISSING` | error | merah |
| Opname — hasil | `UNEXPECTED` | warning | kuning |

Contoh pakai:

```tsx
import { StatusBadge } from '@/components/status-badge'
import { PO_STATUS_TONE } from '@/lib/domain-status'

<StatusBadge tone={PO_STATUS_TONE.DITERIMA} label="Diterima" />
```

---

## 8. Halaman contoh

`src/pages/design-system-page.tsx` (route `/design-system`) me-render seluruh token di atas —
palet warna, type scale, button/input/table/badge/modal/toast — sebagai bukti kode kalau token
kepasang benar. Ini bukti "sesuai token" di sisi kode; generate halaman lewat Google Stitch pakai
blok prompt di §9 tetap perlu dilakukan manual oleh desainer di tool Stitch-nya (di luar jangkauan
proyek kode ini).

---

## 9. Prompt template Stitch

Tempel blok ini sebagai header di **setiap** prompt Google Stitch, sebelum deskripsi halaman:

```
DESIGN SYSTEM — GoldTrack (wajib diikuti persis, jangan improvisasi warna/font baru)

Theme: light mode only, spacious density, brand accent green.
Font: Inter (fallback: system-ui, sans-serif). Only weights 400, 500, 600 — never bolder.

Colors:
- Primary/accent (buttons, active states): #12B76A, hover #039855, active/text-on-tint #027A48
- Primary tint background: #ECFDF3 (bg-50) / #D1FADF (bg-100)
- Page background: #F9FAFB. Card/surface background: #FFFFFF.
- Borders: #EAECF0 (default), #D0D5DD (inputs/dividers)
- Text: #101828 (primary), #344054 (labels), #667085 (secondary/placeholder)
- Semantic: success #12B76A, warning #F79009, error #F04438, info #2E90FA

Typography:
- H1 28px/600/1.3, H2 22px/600/1.35, H3 18px/500/1.4
- Body 15px/400/1.6, Caption 13px/400/1.5, Input label 14px/500/1.4

Spacing: 4px base scale (4/8/12/16/20/24/32/40/48/64). Card padding 24px, form field gap 20px,
table cell padding 12px vertical / 16px horizontal, section margin 32px. Keep generous whitespace
(spacious density) — do not compress.

Radius: 6px (badges, inputs), 8px (buttons, small cards), 12px (cards, modals).

Shadows: subtle only — card 0 1px 3px rgba(16,24,40,0.10), modal 0 8px 24px rgba(16,24,40,0.12).
Never use heavy/dark drop shadows.

Components:
- Button primary: green-500 bg, white text, radius 8px, hover green-600, padding ~10px/16px.
- Button secondary: white bg, gray-300 border, gray-700 text, hover gray-50 bg.
- Button danger: error bg, white text.
- Input: gray-300 border, radius 6px, 40px height, gray-700 label above, error text below on error.
- Table: gray-100 header bg, gray-500 uppercase 12px header text, gray-200 row divider, gray-50 row hover.
- Status badge: full pill radius, light tint background (100-level of its color), dark text
  (700-level of its color). Fixed mapping — do not invent new colors per page:
  success = green, warning = amber, error = red, neutral/cancelled = gray.
- Modal: white card, radius 12px, overlay rgba(16,24,40,0.4), modal shadow above.
- Toast: top-right corner, white card, 4px left border colored by status, icon + message.

Icons: Lucide outline icon set only. 16px inline, 20px in buttons, 24px max.

--- page-specific prompt below ---
```

---

## 10. File map

| Apa | Di mana |
|---|---|
| Token mentah (CSS vars) | `src/index.css` |
| shadcn config | `components.json` |
| UI primitives | `src/components/ui/*` |
| Domain status → tone mapping | `src/lib/domain-status.ts` |
| Status badge component | `src/components/status-badge.tsx` |
| Icon size constants | `src/lib/icon-size.ts` |
| Halaman contoh | `src/pages/design-system-page.tsx` (`/design-system`) |
| Dokumen ini | `docs/design-system.md` |
