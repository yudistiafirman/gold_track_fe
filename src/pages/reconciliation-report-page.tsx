import {
  CalendarCheck,
  Scale,
  ScrollText,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/empty-state'
import { KpiCard } from '@/components/reports/kpi-card'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useReconciliationReport } from '@/hooks/use-reconciliation-report'
import { ApiError } from '@/lib/api/error'
import { RECONCILIATION_TONE } from '@/lib/domain-status'
import { formatCurrency, formatDate } from '@/lib/format'

/** Rupiah with an explicit +/- so the direction of the gap is never lost. */
function formatSignedCurrency(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${sign}${formatCurrency(Math.abs(value))}`
}

export function ReconciliationReportPage() {
  const reportQuery = useReconciliationReport()
  const report = reportQuery.data

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h1 text-gray-900">Rekonsiliasi Saldo</h1>
        <p className="text-caption text-gray-500">
          Membandingkan saldo toko sekarang dengan penutupan buku terakhir + laba yang sudah
          dibukukan sejak itu.
        </p>
      </div>

      {reportQuery.isPending ? (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-8 w-40" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-40 w-full" />
        </div>
      ) : reportQuery.isError ? (
        <div className="rounded-xl border border-border bg-card shadow-card">
          <EmptyState
            icon={Scale}
            title="Gagal memuat rekonsiliasi"
            description={
              reportQuery.error instanceof ApiError
                ? reportQuery.error.message
                : 'Terjadi kesalahan, silakan coba lagi.'
            }
          />
        </div>
      ) : report && !report.has_baseline ? (
        <div className="rounded-xl border border-border bg-card shadow-card">
          <EmptyState
            icon={CalendarCheck}
            title="Belum Ada Penutupan"
            description="Rekonsiliasi butuh minimal satu penutupan buku sebagai baseline. Tutup buku hari ini dulu, lalu kembali ke sini besok untuk melihat perbandingannya."
            action={
              <Button asChild className="mt-2">
                <Link to="/daily-closings">Ke Halaman Tutup Buku</Link>
              </Button>
            }
          />
        </div>
      ) : (
        report && (
          <>
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
              <StatusBadge
                tone={RECONCILIATION_TONE[String(report.in_sync) as 'true' | 'false']}
                label={report.in_sync ? 'Sinkron' : 'Tidak Sinkron'}
                className="px-3 py-1 text-body"
              />
              <p className="text-caption text-gray-500">
                {report.in_sync
                  ? 'Saldo aktual sesuai dengan yang diharapkan dari pembukuan.'
                  : 'Ada selisih antara saldo aktual dan yang diharapkan — kemungkinan ada uang masuk/keluar yang belum tercatat.'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <KpiCard
                label="Saldo Penutupan Terakhir"
                value={formatCurrency(report.last_closing_saldo ?? 0)}
                icon={CalendarCheck}
                caption={`Ditutup ${formatDate(report.last_closing_date)}`}
              />
              <KpiCard
                label="Laba Periode Berjalan"
                value={formatCurrency(report.period_net_profit ?? 0)}
                icon={TrendingUp}
                caption={`${formatDate(report.period_from)} – ${formatDate(report.period_to)}`}
              />
              <KpiCard
                label="Saldo Diharapkan"
                value={formatCurrency(report.expected_saldo ?? 0)}
                icon={ScrollText}
              />
              <KpiCard
                label="Saldo Aktual"
                value={formatCurrency(report.actual_saldo)}
                icon={Wallet}
              />
              <KpiCard
                label="Selisih"
                value={formatSignedCurrency(report.difference ?? 0)}
                icon={Scale}
                tone={report.difference && report.difference !== 0 ? 'negative' : 'default'}
              />
            </div>

            <div className="overflow-hidden rounded-xl border border-border shadow-card">
              <div className="border-b border-border bg-accent px-4 py-3.5">
                <h2 className="text-h3 text-gray-900">Rincian Laba Periode Berjalan</h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Komponen</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-gray-900">Pendapatan</TableCell>
                    <TableCell className="text-table-num text-right">
                      {formatCurrency(report.period_revenue ?? 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-gray-900">HPP</TableCell>
                    <TableCell className="text-table-num text-right">
                      {formatCurrency(report.period_cogs ?? 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-gray-900">Pengeluaran</TableCell>
                    <TableCell className="text-table-num text-right">
                      {formatCurrency(report.period_expenses ?? 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-accent font-semibold hover:bg-accent">
                    <TableCell className="text-gray-900">Laba Bersih</TableCell>
                    <TableCell className="text-table-num text-right text-primary">
                      {formatCurrency(report.period_net_profit ?? 0)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </>
        )
      )}
    </div>
  )
}
