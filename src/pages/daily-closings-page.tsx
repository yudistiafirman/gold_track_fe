import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { CalendarCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CloseDailyBalanceDialog } from '@/components/daily-closings/close-daily-balance-dialog'
import { DataTable } from '@/components/data-table/data-table'
import type { DataTableColumn, PaginationMeta } from '@/components/data-table/types'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import type { DailyClosing } from '@/types/daily-closing'

interface DailyClosingListResponse {
  items: DailyClosing[]
  pagination: PaginationMeta
}

const PAGE_SIZE = 20

export function DailyClosingsPage() {
  const [page, setPage] = useState(1)
  const [closeOpen, setCloseOpen] = useState(false)

  const closingsQuery = useQuery({
    queryKey: ['daily-closings', { page }],
    queryFn: () =>
      api.get<DailyClosingListResponse>('/daily-closings', {
        params: { page, limit: PAGE_SIZE },
      }),
    placeholderData: keepPreviousData,
  })

  const columns = useMemo<DataTableColumn<DailyClosing>[]>(
    () => [
      {
        id: 'closing_date',
        header: 'Tanggal Ditutup',
        cell: (row) => formatDate(row.closing_date),
      },
      {
        id: 'total_balance',
        header: 'Saldo Uang',
        className: 'text-table-num text-right',
        cell: (row) => formatCurrency(row.total_balance),
      },
      {
        id: 'total_gold_value',
        header: 'Nilai Emas',
        className: 'text-table-num text-right',
        cell: (row) => formatCurrency(row.total_gold_value),
      },
      {
        id: 'total_saldo',
        header: 'Total Saldo',
        className: 'text-table-num text-right',
        cell: (row) => (
          <span className="font-semibold text-gray-900">{formatCurrency(row.total_saldo)}</span>
        ),
      },
      {
        id: 'created_at',
        header: 'Ditutup Pada',
        cell: (row) => formatDateTime(row.created_at),
      },
    ],
    [],
  )

  const isError = closingsQuery.isError
  const emptyTitle = isError ? 'Gagal memuat riwayat penutupan' : 'Belum ada penutupan'
  const emptyDescription = isError
    ? closingsQuery.error instanceof ApiError
      ? closingsQuery.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : 'Tekan "Tutup Hari Ini" untuk menyimpan snapshot saldo pertama.'

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-h1 text-gray-900">Tutup Buku</h1>
        <p className="text-caption text-gray-500">
          Riwayat penutupan saldo harian. Tiap penutupan menyimpan snapshot beku saldo uang &amp;
          nilai emas sebagai baseline rekonsiliasi.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={closingsQuery.data?.items ?? []}
        getRowId={(row) => row.id}
        isLoading={closingsQuery.isPending}
        pagination={closingsQuery.data?.pagination}
        onPageChange={setPage}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        filters={
          <Button onClick={() => setCloseOpen(true)} className="ml-auto">
            <CalendarCheck />
            Tutup Hari Ini
          </Button>
        }
      />

      <CloseDailyBalanceDialog open={closeOpen} onOpenChange={setCloseOpen} />
    </div>
  )
}
