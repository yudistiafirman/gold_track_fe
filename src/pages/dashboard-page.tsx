import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CalendarRange,
  ClipboardList,
  Coins,
  HandCoins,
  Landmark,
  ListChecks,
  PiggyBank,
  Receipt,
  ScrollText,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/empty-state'
import { KpiCard } from '@/components/reports/kpi-card'
import { StatusBadge } from '@/components/status-badge'
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
import { LOW_STOCK_TONE, PO_STATUS_TONE } from '@/lib/domain-status'
import { firstDayOfMonthInputValue, formatCurrency, formatDate, todayDateInputValue } from '@/lib/format'
import { TRANSACTION_TYPE_ICONS, transactionTypeLabel } from '@/lib/transaction-type'
import { cn } from '@/lib/utils'
import type { DashboardReport } from '@/types/dashboard-report'

interface ReportFilters {
  from: string
  to: string
}

function defaultFilters(): ReportFilters {
  return { from: firstDayOfMonthInputValue(), to: todayDateInputValue() }
}

export function DashboardPage() {
  const [draft, setDraft] = useState<ReportFilters>(defaultFilters)
  const [applied, setApplied] = useState<ReportFilters>(defaultFilters)

  const dashboardQuery = useQuery({
    queryKey: ['reports', 'dashboard', applied],
    queryFn: () =>
      api.get<DashboardReport>('/reports/dashboard', {
        params: {
          from: applied.from || undefined,
          to: applied.to || undefined,
        },
      }),
  })

  const report = dashboardQuery.data
  const isLoading = dashboardQuery.isPending
  const isError = dashboardQuery.isError

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-h1 text-gray-900">Dashboard</h1>
          <p className="text-caption text-gray-500">
            Ringkasan transaksi, stok, dan keuangan toko.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2 shadow-card">
          <CalendarRange className="ml-1 size-4 shrink-0 text-muted-foreground" />
          <Input
            id="dashboard-from"
            type="date"
            aria-label="Dari tanggal"
            value={draft.from}
            onChange={(event) => setDraft((prev) => ({ ...prev, from: event.target.value }))}
            className="w-40"
          />
          <span className="text-caption text-gray-400">—</span>
          <Input
            id="dashboard-to"
            type="date"
            aria-label="Sampai tanggal"
            value={draft.to}
            onChange={(event) => setDraft((prev) => ({ ...prev, to: event.target.value }))}
            className="w-40"
          />
          <Button onClick={() => setApplied(draft)}>Terapkan</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-72 w-full" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={ScrollText}
          title="Gagal memuat dashboard"
          description={
            dashboardQuery.error instanceof ApiError
              ? dashboardQuery.error.message
              : 'Terjadi kesalahan, silakan coba lagi.'
          }
        />
      ) : (
        report && (
          <>
            <div className="rounded-xl border border-border bg-card shadow-card">
              <div className="border-b border-border px-4 py-3.5">
                <h2 className="text-h3 text-gray-900">Ringkasan Kas</h2>
                <p className="text-caption text-gray-500">
                  Snapshot kondisi kas saat ini — tidak berubah oleh filter tanggal di atas.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5">
                <KpiCard
                  label="Total Kas"
                  value={formatCurrency(
                    report.cash_summary.total_gold_value +
                      report.cash_summary.total_balance +
                      report.cash_summary.total_external_funds +
                      report.cash_summary.total_external_debts,
                  )}
                  icon={Banknote}
                  tone="primary"
                />
                <KpiCard
                  label="Total Uang Emas"
                  value={formatCurrency(report.cash_summary.total_gold_value)}
                  icon={Coins}
                />
                <KpiCard
                  label="Total Saldo"
                  value={formatCurrency(report.cash_summary.total_balance)}
                  icon={Wallet}
                />
                <KpiCard
                  label="Uang Diluar"
                  value={formatCurrency(report.cash_summary.total_external_funds)}
                  icon={HandCoins}
                />
                <KpiCard
                  label="Hutang Diluar"
                  value={formatCurrency(report.cash_summary.total_external_debts)}
                  icon={Landmark}
                  tone="negative"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                label="Total Pendapatan"
                value={formatCurrency(report.finance.total_revenue)}
                icon={ScrollText}
              />
              <KpiCard
                label="Laba Kotor"
                value={formatCurrency(report.finance.gross_profit)}
                icon={TrendingUp}
                badge={`Margin ${report.finance.gross_margin_percent.toFixed(1)}%`}
              />
              <KpiCard
                label="Laba Bersih"
                value={formatCurrency(report.finance.net_profit)}
                icon={PiggyBank}
                tone="primary"
              />
              <KpiCard
                label="Total Transaksi"
                value={report.transaction_total.transaction_count.toLocaleString('id-ID')}
                caption={`${report.transaction_total.total_weight} gr total`}
                icon={Receipt}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-card shadow-card">
                <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-gray-100">
                      <ListChecks className="size-4 text-gray-600" />
                    </div>
                    <h2 className="text-h3 text-gray-900">Ringkasan Transaksi</h2>
                  </div>
                  <Link
                    to="/reports/transactions"
                    className="flex items-center gap-1 text-caption font-medium text-primary hover:underline"
                  >
                    Lihat Detail
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
                {report.transaction_breakdown.length === 0 ? (
                  <p className="py-10 text-center text-caption text-gray-500">
                    Belum ada transaksi pada periode ini.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {report.transaction_breakdown.map((row) => {
                      const Icon = TRANSACTION_TYPE_ICONS[row.type]
                      return (
                        <li
                          key={row.type}
                          className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-accent p-2">
                              <Icon className="size-4 text-primary" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-label text-gray-500 uppercase">
                                {transactionTypeLabel(row.type)}
                              </span>
                              <span className="text-caption text-gray-500">
                                {row.transaction_count.toLocaleString('id-ID')} Transaksi
                              </span>
                            </div>
                          </div>
                          <span className="text-table-num text-gray-900">
                            {formatCurrency(row.total_amount)}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              <div className="rounded-xl border border-border bg-card shadow-card">
                <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-gray-100">
                      <ClipboardList className="size-4 text-gray-600" />
                    </div>
                    <h2 className="text-h3 text-gray-900">PO Menunggu Diterima</h2>
                    {report.pending_purchase_orders_total > 0 && (
                      <span className="flex size-6 items-center justify-center rounded-full bg-error/10 text-caption font-semibold text-error">
                        {report.pending_purchase_orders_total}
                      </span>
                    )}
                  </div>
                </div>
                {report.pending_purchase_orders.length === 0 ? (
                  <p className="py-10 text-center text-caption text-gray-500">
                    Tidak ada PO yang menunggu diterima.
                  </p>
                ) : (
                  <>
                    <ul className="divide-y divide-border">
                      {report.pending_purchase_orders.map((po) => (
                        <li
                          key={po.id}
                          className="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-gray-50"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <Link
                              to={`/purchase-orders/${po.id}`}
                              className="text-table-num text-gray-900 hover:text-primary hover:underline"
                            >
                              {po.po_code}
                            </Link>
                            <StatusBadge tone={PO_STATUS_TONE.BELUM_DITERIMA} label="Menunggu Diterima" />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-caption text-gray-500">{po.supplier_name}</span>
                            <span className="text-table-num text-gray-900">
                              {formatCurrency(po.total_amount)}
                            </span>
                          </div>
                          <span className="text-caption text-gray-500">{formatDate(po.created_at)}</span>
                        </li>
                      ))}
                    </ul>
                    {report.pending_purchase_orders_total > report.pending_purchase_orders.length && (
                      <div className="border-t border-border p-3">
                        <Button variant="secondary" asChild className="w-full">
                          <Link to="/purchase-orders">Lihat Semua PO Menunggu</Link>
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-error/20 bg-error/5 shadow-card">
              <div className="flex items-center justify-between border-b border-error/20 px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-error/10">
                    <AlertTriangle className="size-4 text-error" />
                  </div>
                  <div>
                    <h2 className="text-h3 text-gray-900">Stok Menipis</h2>
                    <p className="text-caption text-gray-500">
                      Produk yang membutuhkan restock segera (ambang batas: {report.low_stock_threshold})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {report.low_stock_items.length > 0 && (
                    <span className="flex size-6 items-center justify-center rounded-full bg-error/10 text-caption font-semibold text-error">
                      {report.low_stock_items.length}
                    </span>
                  )}
                  <Link
                    to="/reports/stock"
                    className="flex items-center gap-1 text-caption font-medium text-primary hover:underline"
                  >
                    Lihat Laporan Stok
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
              {report.low_stock_items.length === 0 ? (
                <p className="py-10 text-center text-caption text-gray-500">
                  Semua stok produk dalam kondisi aman.
                </p>
              ) : (
                <div className="max-h-80 overflow-y-auto bg-card">
                  <Table className="table-fixed">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[34%]">Produk</TableHead>
                        <TableHead className="w-[16%] text-right">Tersedia</TableHead>
                        <TableHead className="w-[16%] text-right">Baik</TableHead>
                        <TableHead className="w-[16%] text-right">Rusak</TableHead>
                        <TableHead className="w-[18%] pl-6">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.low_stock_items.map((item) => {
                        const isOutOfStock = item.available_count === 0
                        return (
                          <TableRow
                            key={item.product.id}
                            className={cn(isOutOfStock ? 'bg-error/10 hover:bg-error/15' : 'bg-warning/5 hover:bg-warning/10')}
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
                              {isOutOfStock ? (
                                <StatusBadge tone={LOW_STOCK_TONE} label="Habis" />
                              ) : (
                                <StatusBadge tone="warning" label="Menipis" />
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </>
        )
      )}
    </div>
  )
}
