import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  Download,
  FileBarChart,
  Minus,
  PieChart,
  PiggyBank,
  Receipt,
  RotateCcw,
  ScrollText,
  TrendingDown,
  TrendingUp,
  Workflow,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { EmptyState } from '@/components/empty-state'
import { ExpenseDonutChart } from '@/components/reports/expense-donut-chart'
import { KpiCard } from '@/components/reports/kpi-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { firstDayOfMonthInputValue, formatCompactCurrency, formatCurrency, todayDateInputValue } from '@/lib/format'
import { transactionTypeLabel as salesTypeLabel } from '@/lib/transaction-type'
import { cn } from '@/lib/utils'
import type { FinanceReport } from '@/types/finance-report'

interface ReportFilters {
  from: string
  to: string
}

function defaultFilters(): ReportFilters {
  return { from: firstDayOfMonthInputValue(), to: todayDateInputValue() }
}

function allTimeFilters(): ReportFilters {
  return { from: '', to: '' }
}

export function FinanceReportPage() {
  const [draft, setDraft] = useState<ReportFilters>(defaultFilters)
  const [applied, setApplied] = useState<ReportFilters>(defaultFilters)

  const reportQuery = useQuery({
    queryKey: ['reports', 'finance', applied],
    queryFn: () =>
      api.get<FinanceReport>('/reports/finance', {
        params: {
          from: applied.from || undefined,
          to: applied.to || undefined,
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
      ['Ringkasan', ''],
      ['Total Pendapatan', report.total_revenue],
      ['Total HPP', report.total_cogs],
      ['Laba Kotor', report.gross_profit],
      ['Margin Kotor (%)', report.gross_margin_percent],
      ['Total Pengeluaran', report.total_expenses],
      ['Laba Bersih', report.net_profit],
      [],
      ['Rincian Penjualan', ''],
      ['Tipe', 'Jml Transaksi', 'Pendapatan', 'HPP', 'Laba Kotor'],
      ...report.sales_breakdown.map((row) => [
        salesTypeLabel(row.type),
        row.transaction_count,
        row.total_revenue,
        row.total_cogs,
        row.gross_profit,
      ]),
      [],
      ['Rincian Pengeluaran', ''],
      ['Kategori', 'Total'],
      ...report.expense_breakdown.map((row) => [row.category.name, row.total_amount]),
    ]

    const rangeLabel = `${applied.from || 'semua'}_${applied.to || 'semua'}`
    downloadCsv(`laporan-keuangan_${rangeLabel}.csv`, rows)
  }

  const report = reportQuery.data
  const isLoading = reportQuery.isPending
  const isError = reportQuery.isError
  const isEmpty = !!report && report.total_revenue === 0 && report.total_expenses === 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h1 text-gray-900">Laporan Keuangan</h1>
        <p className="text-caption text-gray-500">
          Ringkasan laba & pengeluaran toko per periode.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="finance-from" className="text-label text-gray-700 uppercase">
            Dari Tanggal
          </label>
          <Input
            id="finance-from"
            type="date"
            value={draft.from}
            onChange={(event) => setDraft((prev) => ({ ...prev, from: event.target.value }))}
            className="w-44"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="finance-to" className="text-label text-gray-700 uppercase">
            Sampai Tanggal
          </label>
          <Input
            id="finance-to"
            type="date"
            value={draft.to}
            onChange={(event) => setDraft((prev) => ({ ...prev, to: event.target.value }))}
            className="w-44"
          />
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-80 w-full" />
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
        <div className="rounded-xl border border-border bg-card shadow-card">
          <EmptyState
            icon={FileBarChart}
            title="Tidak Ada Data Keuangan"
            description="Belum ada transaksi atau pengeluaran yang tercatat untuk periode yang Anda pilih. Coba sesuaikan filter tanggal atau lihat semua data."
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <KpiCard
                label="Total Pendapatan"
                value={formatCurrency(report.total_revenue)}
                icon={ScrollText}
              />
              <KpiCard label="Total HPP" value={formatCurrency(report.total_cogs)} icon={Receipt} />
              <KpiCard
                label="Laba Kotor"
                value={formatCurrency(report.gross_profit)}
                icon={TrendingUp}
                badge={`Margin ${report.gross_margin_percent.toFixed(1)}%`}
              />
              <KpiCard
                label="Total Pengeluaran"
                value={formatCurrency(report.total_expenses)}
                icon={TrendingDown}
                tone="negative"
              />
              <KpiCard
                label="Laba Bersih"
                value={formatCurrency(report.net_profit)}
                icon={PiggyBank}
                tone="primary"
              />
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-lg bg-gray-100">
                  <Workflow className="size-4 text-gray-600" />
                </div>
                <h2 className="text-h3 text-gray-900">Profit Flow</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <FlowStep label="Pendapatan" value={report.total_revenue} />
                <FlowOperator icon={Minus} />
                <FlowStep label="HPP" value={report.total_cogs} />
                <FlowOperator icon={ArrowRight} />
                <FlowStep label="Laba Kotor" value={report.gross_profit} tone="neutral" />
                <FlowOperator icon={Minus} />
                <FlowStep label="Pengeluaran" value={report.total_expenses} tone="negative" />
                <FlowOperator icon={ArrowRight} />
                <FlowStep label="Laba Bersih" value={report.net_profit} tone="primary" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="overflow-hidden rounded-xl border border-border shadow-card">
                <div className="flex items-center gap-2.5 border-b border-border bg-accent px-4 py-3.5">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-white/60">
                    <ScrollText className="size-4 text-green-700" />
                  </div>
                  <h2 className="text-h3 text-gray-900">Rincian Penjualan</h2>
                </div>
                {report.sales_breakdown.length === 0 ? (
                  <p className="py-10 text-center text-caption text-gray-500">
                    Tidak ada data penjualan.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipe</TableHead>
                        <TableHead className="text-right">Jml Transaksi</TableHead>
                        <TableHead className="text-right">Pendapatan</TableHead>
                        <TableHead className="text-right">HPP</TableHead>
                        <TableHead className="text-right">Laba Kotor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.sales_breakdown.map((row) => (
                        <TableRow key={row.type}>
                          <TableCell className="text-gray-900">{salesTypeLabel(row.type)}</TableCell>
                          <TableCell className="text-table-num text-right">
                            {row.transaction_count.toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell className="text-table-num text-right">
                            {formatCurrency(row.total_revenue)}
                          </TableCell>
                          <TableCell className="text-table-num text-right">
                            {formatCurrency(row.total_cogs)}
                          </TableCell>
                          <TableCell className="text-table-num text-right text-success">
                            {formatCurrency(row.gross_profit)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-accent font-semibold hover:bg-accent">
                        <TableCell className="text-gray-900">Total</TableCell>
                        <TableCell className="text-table-num text-right">
                          {report.sales_breakdown
                            .reduce((sum, row) => sum + row.transaction_count, 0)
                            .toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-table-num text-right">
                          {formatCurrency(report.total_revenue)}
                        </TableCell>
                        <TableCell className="text-table-num text-right">
                          {formatCurrency(report.total_cogs)}
                        </TableCell>
                        <TableCell className="text-table-num text-right text-primary">
                          {formatCurrency(report.gross_profit)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </div>

              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-gray-100">
                    <PieChart className="size-4 text-gray-600" />
                  </div>
                  <h2 className="text-h3 text-gray-900">Rincian Pengeluaran</h2>
                </div>
                <ExpenseDonutChart
                  data={report.expense_breakdown.map((row) => ({
                    id: row.category.id,
                    label: row.category.name,
                    value: row.total_amount,
                  }))}
                  total={report.total_expenses}
                />
              </div>
            </div>
          </>
        )
      )}
    </div>
  )
}

interface FlowStepProps {
  label: string
  value: number
  tone?: 'default' | 'negative' | 'primary' | 'neutral'
}

function FlowStep({ label, value, tone = 'default' }: FlowStepProps) {
  return (
    <div
      className={cn(
        'flex min-w-24 flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-center',
        tone === 'neutral' && 'bg-accent',
        tone === 'primary' && 'bg-gradient-to-br from-green-500 to-green-700 text-primary-foreground',
      )}
    >
      <span
        className={cn(
          'text-caption',
          tone === 'primary' ? 'text-primary-foreground/80' : 'text-gray-500',
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'text-body font-semibold tabular-nums',
          tone === 'primary' ? 'text-primary-foreground' : tone === 'negative' ? 'text-error' : 'text-gray-900',
        )}
      >
        {formatCompactCurrency(value)}
      </span>
    </div>
  )
}

function FlowOperator({ icon: Icon }: { icon: React.ComponentType<{ className?: string }> }): ReactNode {
  return (
    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <Icon className="size-3.5" />
    </div>
  )
}
