import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  LOW_STOCK_TONE,
  OPNAME_RESULT_TONE,
  PO_STATUS_TONE,
  STOCK_CONDITION_TONE,
  STOCK_STATUS_TONE,
} from '@/lib/domain-status'

const colorGroups = [
  {
    title: 'Brand — hijau',
    swatches: [
      { name: 'green-50', className: 'bg-green-50' },
      { name: 'green-100', className: 'bg-green-100' },
      { name: 'green-500', className: 'bg-green-500' },
      { name: 'green-600', className: 'bg-green-600' },
      { name: 'green-700', className: 'bg-green-700' },
    ],
  },
  {
    title: 'Netral — abu-abu',
    swatches: [
      { name: 'gray-50', className: 'bg-gray-50' },
      { name: 'gray-100', className: 'bg-gray-100' },
      { name: 'gray-200', className: 'bg-gray-200' },
      { name: 'gray-300', className: 'bg-gray-300' },
      { name: 'gray-500', className: 'bg-gray-500' },
      { name: 'gray-700', className: 'bg-gray-700' },
      { name: 'gray-900', className: 'bg-gray-900' },
    ],
  },
  {
    title: 'Semantic',
    swatches: [
      { name: 'success', className: 'bg-success' },
      { name: 'warning', className: 'bg-warning' },
      { name: 'error', className: 'bg-error' },
      { name: 'info', className: 'bg-info' },
    ],
  },
]

const poRows = [
  { id: 'PO-1001', supplier: 'CV Emas Jaya', status: 'DITERIMA' as const },
  { id: 'PO-1002', supplier: 'PT Logam Mulia', status: 'BELUM_DITERIMA' as const },
  { id: 'PO-1003', supplier: 'CV Berkah Mas', status: 'DIBATALKAN' as const },
]

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h2 text-gray-900">{title}</h2>
      {children}
    </section>
  )
}

export function DesignSystemPage() {
  return (
    <div className="flex flex-col gap-8 pb-16">
      <div>
        <h1 className="text-h1 text-gray-900">Design System</h1>
        <p className="text-body text-gray-500">
          Referensi visual token FE-000 — bukti bahwa token sudah kepasang benar di kode.
        </p>
      </div>

      <Section title="Warna">
        <div className="flex flex-col gap-6">
          {colorGroups.map((group) => (
            <div key={group.title} className="flex flex-col gap-2">
              <h3 className="text-h3 text-gray-700">{group.title}</h3>
              <div className="flex flex-wrap gap-3">
                {group.swatches.map((swatch) => (
                  <div key={swatch.name} className="flex flex-col items-center gap-1.5">
                    <div
                      className={`size-16 rounded-md border border-border ${swatch.className}`}
                    />
                    <span className="text-caption text-gray-500">{swatch.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Tipografi">
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6 shadow-card">
          <p className="text-h1 text-gray-900">Heading 1 — 28px/600</p>
          <p className="text-h2 text-gray-900">Heading 2 — 22px/600</p>
          <p className="text-h3 text-gray-900">Heading 3 — 18px/500</p>
          <p className="text-body text-gray-900">Body — 15px/400. Teks utama untuk paragraf.</p>
          <p className="text-caption text-gray-500">Caption — 13px/400, teks sekunder.</p>
          <p className="text-label text-gray-700">Label input — 14px/500</p>
          <p className="text-table-num text-gray-900">Angka tabel — 15px/500 — 1.234.567</p>
        </div>
      </Section>

      <Section title="Button">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Danger</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      <Section title="Input">
        <div className="flex max-w-sm flex-col gap-1.5">
          <Label htmlFor="ds-example-input" className="text-label text-gray-700">
            Nama barang
          </Label>
          <Input id="ds-example-input" placeholder="Contoh: Cincin Emas 24K" />
        </div>
      </Section>

      <Section title="Tabel & Status badge">
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No PO</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {poRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-table-num">{row.id}</TableCell>
                  <TableCell>{row.supplier}</TableCell>
                  <TableCell>
                    <StatusBadge tone={PO_STATUS_TONE[row.status]} label={row.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusBadge tone={STOCK_STATUS_TONE.AVAILABLE} label="AVAILABLE" />
          <StatusBadge tone={STOCK_STATUS_TONE.SOLD} label="SOLD" />
          <StatusBadge tone={STOCK_CONDITION_TONE.GOOD} label="GOOD" />
          <StatusBadge tone={STOCK_CONDITION_TONE.BAD} label="BAD" />
          <StatusBadge tone={LOW_STOCK_TONE} label="LOW STOCK" />
          <StatusBadge tone={OPNAME_RESULT_TONE.MATCH} label="MATCH" />
          <StatusBadge tone={OPNAME_RESULT_TONE.MISSING} label="MISSING" />
          <StatusBadge tone={OPNAME_RESULT_TONE.UNEXPECTED} label="UNEXPECTED" />
        </div>
      </Section>

      <Section title="Modal">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary">Buka modal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi</DialogTitle>
              <DialogDescription>
                Contoh modal sesuai token — radius-lg, overlay gelap, shadow modal.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="secondary">Batal</Button>
              <Button>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Section>

      <Section title="Toast">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => toast.success('Data berhasil disimpan')}>
            Success
          </Button>
          <Button variant="secondary" onClick={() => toast.warning('Stok hampir habis')}>
            Warning
          </Button>
          <Button variant="secondary" onClick={() => toast.error('Gagal menyimpan data')}>
            Error
          </Button>
          <Button variant="secondary" onClick={() => toast.info('Sinkronisasi selesai')}>
            Info
          </Button>
        </div>
      </Section>
    </div>
  )
}
