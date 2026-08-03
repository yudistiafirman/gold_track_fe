import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Download, FileBarChart, Package, RotateCcw, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState } from '@/components/empty-state'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import { downloadCsv } from '@/lib/csv'
import { LOW_STOCK_TONE } from '@/lib/domain-status'
import { cn } from '@/lib/utils'
import type { StockReport } from '@/types/stock-report'

const DEFAULT_THRESHOLD = 5

type StatusFilter = 'ALL' | 'LOW' | 'SAFE'

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Semua Status' },
  { value: 'SAFE', label: 'Aman' },
  { value: 'LOW', label: 'Menipis' },
]

export function StockReportPage() {
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD)
  const [appliedThreshold, setAppliedThreshold] = useState(DEFAULT_THRESHOLD)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [search, setSearch] = useState('')

  const reportQuery = useQuery({
    queryKey: ['reports', 'stock', appliedThreshold],
    queryFn: () =>
      api.get<StockReport>('/reports/stock', {
        params: { threshold: appliedThreshold },
      }),
  })

  const report = reportQuery.data
  const isLoading = reportQuery.isPending
  const isError = reportQuery.isError
  const isEmpty = !!report && report.items.length === 0

  const filteredItems = useMemo(() => {
    if (!report) return []
    const query = search.trim().toLowerCase()
    return report.items.filter((item) => {
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'LOW' && item.low_stock) ||
        (statusFilter === 'SAFE' && !item.low_stock)
      const matchesSearch =
        !query ||
        item.product.name.toLowerCase().includes(query) ||
        item.product.sku.toLowerCase().includes(query)
      return matchesStatus && matchesSearch
    })
  }, [report, statusFilter, search])

  const lowStockCount = report ? report.items.filter((item) => item.low_stock).length : 0
  const isFilteredEmpty = !!report && report.items.length > 0 && filteredItems.length === 0

  function handleApplyThreshold() {
    setAppliedThreshold(threshold)
  }

  function handleResetFilter() {
    setStatusFilter('ALL')
    setSearch('')
  }

  function handleExport() {
    if (!report) return

    const rows: (string | number)[][] = [
      ['SKU', 'Nama Produk', 'Tersedia', 'Kondisi Baik', 'Kondisi Rusak', 'Status'],
      ...filteredItems.map((item) => [
        item.product.sku,
        item.product.name,
        item.available_count,
        item.good_count,
        item.bad_count,
        item.low_stock ? 'Menipis' : 'Aman',
      ]),
    ]

    downloadCsv(`laporan-stok_threshold-${report.threshold}.csv`, rows)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h1 text-gray-900">Laporan Stok</h1>
        <p className="text-caption text-gray-500">
          Pantau ketersediaan stok & produk yang menipis per kategori.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4 shadow-card">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="report-threshold" className="text-label text-gray-700 uppercase">
            Ambang Batas Stok
          </label>
          <Input
            id="report-threshold"
            type="number"
            min={0}
            value={threshold}
            onChange={(event) => setThreshold(Number(event.target.value))}
            className="w-32"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="report-status" className="text-label text-gray-700 uppercase">
            Status Stok
          </label>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
            <SelectTrigger id="report-status" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="report-search" className="text-label text-gray-700 uppercase">
            Pencarian
          </label>
          <Input
            id="report-search"
            placeholder="Cari nama produk..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-56"
          />
        </div>
        <Button onClick={handleApplyThreshold}>Terapkan</Button>
        <Button
          variant="secondary"
          onClick={handleExport}
          disabled={!report || isEmpty}
          className="ml-auto"
        >
          <Download />
          Export
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-72 w-full" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={FileBarChart}
          title="Gagal memuat laporan"
          description={
            reportQuery.error instanceof ApiError
              ? reportQuery.error.message
              : 'Terjadi kesalahan, silakan coba lagi.'
          }
        />
      ) : isEmpty ? (
        <div className="rounded-lg border border-border bg-card shadow-card">
          <EmptyState
            icon={Package}
            title="Belum Ada Data Stok"
            description="Belum ada produk dengan stok yang tercatat untuk ditampilkan di laporan ini."
          />
        </div>
      ) : (
        report && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-4 shadow-card">
                <div className="flex items-start justify-between">
                  <p className="text-label text-gray-500 uppercase">Total Produk</p>
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Package className="size-5 text-primary" />
                  </div>
                </div>
                <p className="text-h1 tabular-nums text-gray-900">
                  {report.items.length.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 shadow-card">
                <div className="flex items-start justify-between">
                  <p className="text-label text-gray-500 uppercase">Stok Aman</p>
                  <div className="rounded-lg bg-green-100 p-2">
                    <ShieldCheck className="size-5 text-green-700" />
                  </div>
                </div>
                <p className="text-h1 tabular-nums text-gray-900">
                  {(report.items.length - lowStockCount).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 shadow-card">
                <div className="flex items-start justify-between">
                  <p className="text-label text-gray-500 uppercase">Stok Menipis</p>
                  <div className="rounded-lg bg-error/10 p-2">
                    <AlertTriangle className="size-5 text-error" />
                  </div>
                </div>
                <p className="text-h1 tabular-nums text-gray-900">
                  {lowStockCount.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
              <div className="border-b border-border bg-accent px-4 py-3">
                <h2 className="text-h3 text-gray-900">
                  Threshold saat ini: {report.threshold} unit
                </h2>
              </div>
              {isFilteredEmpty ? (
                <EmptyState
                  icon={FileBarChart}
                  title="Tidak Ada Produk Cocok"
                  description="Tidak ada produk yang cocok dengan filter status atau pencarian yang Anda pilih."
                  action={
                    <Button variant="secondary" onClick={handleResetFilter}>
                      <RotateCcw />
                      Reset Filter
                    </Button>
                  }
                />
              ) : (
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[34%]">Produk</TableHead>
                      <TableHead className="w-[16%] text-right">Tersedia</TableHead>
                      <TableHead className="w-[16%] text-right">Kondisi Baik</TableHead>
                      <TableHead className="w-[16%] text-right">Kondisi Rusak</TableHead>
                      <TableHead className="w-[18%] pl-6">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow
                        key={item.product.id}
                        className={cn(item.low_stock && 'bg-error/5 hover:bg-error/10')}
                      >
                        <TableCell className="whitespace-normal">
                          <div className="flex flex-col">
                            <span className="truncate font-medium text-gray-900">
                              {item.product.name}
                            </span>
                            <span className="truncate text-caption text-gray-500">
                              {item.product.sku}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-table-num text-right">
                          {item.available_count.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-table-num text-right">
                          {item.good_count.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-table-num text-right">
                          {item.bad_count.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="pl-6">
                          {item.low_stock ? (
                            <StatusBadge tone={LOW_STOCK_TONE} label="Menipis" />
                          ) : (
                            <StatusBadge tone="success" label="Aman" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </>
        )
      )}
    </div>
  )
}
