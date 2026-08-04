import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Play } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DataTable } from '@/components/data-table/data-table'
import type { DataTableColumn, PaginationMeta } from '@/components/data-table/types'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import { OPNAME_SESSION_STATUS_TONE, type OpnameSessionStatus, resolveStatusTone } from '@/lib/domain-status'
import { formatDate } from '@/lib/format'
import type { StockOpname } from '@/types/stock-opname'

interface StockOpnameListResponse {
  items: StockOpname[]
  pagination: PaginationMeta
}

const PAGE_SIZE = 10

/**
 * CANCELLED left out on purpose: it's in the BE's status enum but there's no
 * cancel-session feature yet, so filtering on it would only ever return an
 * empty list.
 */
const STATUS_OPTIONS: { value: OpnameSessionStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Semua status' },
  { value: 'IN_PROGRESS', label: 'Berjalan' },
  { value: 'COMPLETED', label: 'Selesai' },
]

const columns: DataTableColumn<StockOpname>[] = [
  {
    id: 'opname_code',
    header: 'Kode Opname',
    cell: (row) => (
      <Link
        to={`/stock-opnames/${row.id}`}
        className="text-table-num text-gray-900 hover:text-primary hover:underline"
      >
        {row.opname_code}
      </Link>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => (
      <StatusBadge tone={resolveStatusTone(OPNAME_SESSION_STATUS_TONE, row.status)} label={row.status} />
    ),
  },
  {
    id: 'opname_date',
    header: 'Tanggal',
    cell: (row) => formatDate(row.opname_date),
  },
  {
    id: 'notes',
    header: 'Catatan',
    cell: (row) => row.notes || '—',
  },
]

export function StockOpnamesPage() {
  const [status, setStatus] = useState<OpnameSessionStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(1)

  const opnamesQuery = useQuery({
    queryKey: ['stock-opnames', { status, page }],
    queryFn: () =>
      api.get<StockOpnameListResponse>('/stock-opnames', {
        params: { status: status === 'ALL' ? undefined : status, page, limit: PAGE_SIZE },
      }),
    placeholderData: keepPreviousData,
  })

  const isError = opnamesQuery.isError
  const emptyTitle = isError ? 'Gagal memuat riwayat opname' : 'Belum ada sesi opname'
  const emptyDescription = isError
    ? opnamesQuery.error instanceof ApiError
      ? opnamesQuery.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : undefined

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-h1 text-gray-900">Stock Opname</h1>
        <Button asChild>
          <Link to="/stock-opnames/new">
            <Play />
            Mulai Opname Baru
          </Link>
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={opnamesQuery.data?.items ?? []}
        getRowId={(row) => row.id}
        isLoading={opnamesQuery.isPending}
        pagination={opnamesQuery.data?.pagination}
        onPageChange={setPage}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        filters={
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as OpnameSessionStatus | 'ALL')
              setPage(1)
            }}
          >
            <SelectTrigger className="w-40">
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
        }
      />
    </div>
  )
}
