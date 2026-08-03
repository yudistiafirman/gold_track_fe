import { useQuery } from '@tanstack/react-query'
import { ClipboardList, Download, FileBarChart, RotateCcw, Scale, Wallet } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '@/components/empty-state'
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
import { firstDayOfMonthInputValue, formatCurrency, todayDateInputValue } from '@/lib/format'
import {
  TRANSACTION_TYPE_BADGE_CLASSES as TYPE_BADGE_CLASSES,
  TRANSACTION_TYPE_BAR_CLASSES as TYPE_BAR_CLASSES,
  TRANSACTION_TYPE_LABELS as TYPE_LABELS,
} from '@/lib/transaction-type'
import { cn } from '@/lib/utils'
import type { TransactionReport, TransactionReportType } from '@/types/transaction-report'

const TYPE_OPTIONS: { value: TransactionReportType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Semua Tipe' },
  { value: 'SELL', label: 'Penjualan' },
  { value: 'BUY', label: 'Buyback' },
  { value: 'SELL_SUPPLIER', label: 'Jual ke Supplier' },
]

interface ReportFilters {
  from: string
  to: string
  type: TransactionReportType | 'ALL'
}

function defaultFilters(): ReportFilters {
  return { from: firstDayOfMonthInputValue(), to: todayDateInputValue(), type: 'ALL' }
}

function allTimeFilters(): ReportFilters {
  return { from: '', to: '', type: 'ALL' }
}

export function TransactionsReportPage() {
  const [draft, setDraft] = useState<ReportFilters>(defaultFilters)
  const [applied, setApplied] = useState<ReportFilters>(defaultFilters)

  const reportQuery = useQuery({
    queryKey: ['reports', 'transactions', applied],
    queryFn: () =>
      api.get<TransactionReport>('/reports/transactions', {
        params: {
          from: applied.from || undefined,
          to: applied.to || undefined,
          type: applied.type === 'ALL' ? undefined : applied.type,
        },
      }),
  })

  function handleResetFilter() {
    const next = defaultFilters()
    setDraft(next)
    setApplied(next)
  }

  function handleViewAll() {
    const next = allTimeFilters()
    setDraft(next)
    setApplied(next)
  }

  function handleExport() {
    if (!report) return

    const rows: (string | number)[][] = [
      ['Tipe', 'Jumlah Transaksi', 'Total Nilai (Rp)', 'Total Berat (gr)'],
      ...report.breakdown.map((row) => [
        TYPE_LABELS[row.type],
        row.transaction_count,
        row.total_amount,
        row.total_weight,
      ]),
      [
        'Total Keseluruhan',
        report.total.transaction_count,
        report.total.total_amount,
        report.total.total_weight,
      ],
    ]

    const rangeLabel = `${applied.from || 'semua'}_${applied.to || 'semua'}`
    downloadCsv(`laporan-transaksi_${rangeLabel}.csv`, rows)
  }

  const report = reportQuery.data
  const isLoading = reportQuery.isPending
  const isError = reportQuery.isError
  const isEmpty = !!report && report.total.transaction_count === 0

  const maxAmount = report ? Math.max(1, ...report.breakdown.map((row) => row.total_amount)) : 1
  const dominant = report?.breakdown.reduce<typeof report.breakdown[number] | null>(
    (best, row) => (!best || row.total_amount > best.total_amount ? row : best),
    null,
  )
  const dominantShare =
    dominant && report && report.total.total_amount > 0
      ? (dominant.total_amount / report.total.total_amount) * 100
      : 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h1 text-gray-900">Laporan Transaksi</h1>
        <p className="text-caption text-gray-500">
          Ringkasan aktivitas transaksi penjualan, buyback, dan supplier.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4 shadow-card">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="report-from" className="text-label text-gray-700 uppercase">
            Dari Tanggal
          </label>
          <Input
            id="report-from"
            type="date"
            value={draft.from}
            onChange={(event) => setDraft((prev) => ({ ...prev, from: event.target.value }))}
            className="w-44"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="report-to" className="text-label text-gray-700 uppercase">
            Sampai Tanggal
          </label>
          <Input
            id="report-to"
            type="date"
            value={draft.to}
            onChange={(event) => setDraft((prev) => ({ ...prev, to: event.target.value }))}
            className="w-44"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="report-type" className="text-label text-gray-700 uppercase">
            Tipe Transaksi
          </label>
          <Select
            value={draft.type}
            onValueChange={(value) =>
              setDraft((prev) => ({ ...prev, type: value as TransactionReportType | 'ALL' }))
            }
          >
            <SelectTrigger id="report-type" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setApplied(draft)}>Terapkan</Button>
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
            icon={FileBarChart}
            title="Tidak Ada Transaksi"
            description="Belum ada data transaksi yang tercatat untuk periode atau filter yang Anda pilih. Coba sesuaikan filter pencarian atau lihat semua data."
            action={
              <div className="mt-2 flex gap-2">
                <Button variant="secondary" onClick={handleResetFilter}>
                  <RotateCcw />
                  Reset Filter
                </Button>
                <Button onClick={handleViewAll}>Lihat Semua Data</Button>
              </div>
            }
          />
        </div>
      ) : (
        report && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-4 shadow-card">
                <div className="flex items-start justify-between">
                  <p className="text-label text-gray-500 uppercase">Total Transaksi</p>
                  <div className="rounded-lg bg-primary/10 p-2">
                    <ClipboardList className="size-5 text-primary" />
                  </div>
                </div>
                <p className="text-h1 tabular-nums text-gray-900">
                  {report.total.transaction_count.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 shadow-card">
                <div className="flex items-start justify-between">
                  <p className="text-label text-gray-500 uppercase">Total Nilai</p>
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Wallet className="size-5 text-primary" />
                  </div>
                </div>
                <p className="text-h1 tabular-nums text-gray-900">
                  {formatCurrency(report.total.total_amount)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 shadow-card">
                <div className="flex items-start justify-between">
                  <p className="text-label text-gray-500 uppercase">Total Berat</p>
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Scale className="size-5 text-primary" />
                  </div>
                </div>
                <p className="text-h1 tabular-nums text-gray-900">
                  {report.total.total_weight} gr
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="overflow-hidden rounded-lg border border-border lg:col-span-2">
                <div className="border-b border-border bg-accent px-4 py-3">
                  <h2 className="text-h3 text-gray-900">Rincian Tipe Transaksi</h2>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipe</TableHead>
                      <TableHead className="text-right">Jml Transaksi</TableHead>
                      <TableHead className="text-right">Total Nilai</TableHead>
                      <TableHead className="text-right">Total Berat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.breakdown.map((row) => (
                      <TableRow key={row.type}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'rounded-full px-2.5 py-0.5 text-caption font-medium',
                                TYPE_BADGE_CLASSES[row.type],
                              )}
                            >
                              {row.type}
                            </span>
                            <span className="text-gray-900">{TYPE_LABELS[row.type]}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-table-num text-right">
                          {row.transaction_count.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-table-num text-right">
                          {formatCurrency(row.total_amount)}
                        </TableCell>
                        <TableCell className="text-table-num text-right">
                          {row.total_weight} gr
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-accent font-semibold hover:bg-accent">
                      <TableCell className="text-gray-900">Total Keseluruhan</TableCell>
                      <TableCell className="text-table-num text-right">
                        {report.total.transaction_count.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-table-num text-right text-primary">
                        {formatCurrency(report.total.total_amount)}
                      </TableCell>
                      <TableCell className="text-table-num text-right">
                        {report.total.total_weight} gr
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 shadow-card">
                <h2 className="text-h3 text-gray-900">Distribusi Nilai</h2>

                {report.breakdown.length === 0 ? (
                  <p className="py-8 text-center text-caption text-gray-500">Tidak ada data.</p>
                ) : (
                  <>
                    <div className="flex h-48 justify-around gap-4 border-b border-gray-200">
                      {report.breakdown.map((row) => (
                        <div
                          key={row.type}
                          className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                        >
                          <div
                            className={cn(
                              'w-full max-w-12 rounded-t-md',
                              TYPE_BAR_CLASSES[row.type],
                            )}
                            style={{
                              height: `${Math.max(4, (row.total_amount / maxAmount) * 100)}%`,
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-around gap-4">
                      {report.breakdown.map((row) => (
                        <span
                          key={row.type}
                          className="flex-1 truncate text-center text-caption text-gray-500"
                        >
                          {TYPE_LABELS[row.type]}
                        </span>
                      ))}
                    </div>

                    {dominant && dominant.total_amount > 0 && (
                      <div className="flex items-center gap-2 border-t border-border pt-3">
                        <span
                          className={cn('size-2.5 rounded-full', TYPE_BAR_CLASSES[dominant.type])}
                        />
                        <p className="text-caption text-gray-600">
                          Dominasi:{' '}
                          <span className="font-medium text-gray-900">
                            {TYPE_LABELS[dominant.type]} ({dominantShare.toFixed(1)}%)
                          </span>
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )
      )}
    </div>
  )
}
