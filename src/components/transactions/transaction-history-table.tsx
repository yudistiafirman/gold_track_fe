import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DataTable } from '@/components/data-table/data-table'
import type { DataTableColumn, PaginationMeta } from '@/components/data-table/types'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import { resolveStatusTone, TRANSACTION_STATUS_TONE } from '@/lib/domain-status'
import { formatCurrency, formatDate } from '@/lib/format'
import type { TransactionListItem } from '@/types/transaction-list-item'

interface TransactionListResponse {
  items: TransactionListItem[]
  pagination: PaginationMeta
}

const PAGE_SIZE = 20

const columns: DataTableColumn<TransactionListItem>[] = [
  {
    id: 'transaction_code',
    header: 'Kode Transaksi',
    cell: (row) => (
      <Link
        to={`/transactions/${row.id}`}
        className="text-table-num text-gray-900 hover:text-primary hover:underline"
      >
        {row.transaction_code}
      </Link>
    ),
  },
  {
    id: 'customer',
    header: 'Pelanggan',
    cell: (row) => row.customer?.name ?? '-',
  },
  {
    id: 'created_at',
    header: 'Tanggal',
    cell: (row) => formatDate(row.created_at),
  },
  {
    id: 'total_amount',
    header: 'Total',
    cell: (row) => formatCurrency(row.total_amount),
    className: 'text-table-num',
  },
  {
    id: 'total_weight',
    header: 'Berat',
    cell: (row) => `${row.total_weight} gr`,
    className: 'text-table-num',
  },
  {
    id: 'payment_method',
    header: 'Metode Bayar',
    cell: (row) => row.payment_method,
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => (
      <StatusBadge tone={resolveStatusTone(TRANSACTION_STATUS_TONE, row.status)} label={row.status} />
    ),
  },
]

const CREATE_CONFIG = {
  SELL: { label: 'Buat Penjualan', url: '/sell' },
  BUY: { label: 'Buat Buyback', url: '/buyback' },
} as const

interface TransactionHistoryTableProps {
  type: 'SELL' | 'BUY'
  queryKeyPrefix: string
}

export function TransactionHistoryTable({ type, queryKeyPrefix }: TransactionHistoryTableProps) {
  const [page, setPage] = useState(1)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const transactionsQuery = useQuery({
    queryKey: [queryKeyPrefix, { page, from, to }],
    queryFn: () =>
      api.get<TransactionListResponse>('/transactions', {
        params: { type, from: from || undefined, to: to || undefined, page, limit: PAGE_SIZE },
      }),
    placeholderData: keepPreviousData,
  })

  const isError = transactionsQuery.isError
  const emptyTitle = isError ? 'Gagal memuat riwayat transaksi' : 'Belum ada transaksi'
  const emptyDescription = isError
    ? transactionsQuery.error instanceof ApiError
      ? transactionsQuery.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : undefined

  const create = CREATE_CONFIG[type]

  return (
    <DataTable
      columns={columns}
      data={transactionsQuery.data?.items ?? []}
      getRowId={(row) => row.id}
      isLoading={transactionsQuery.isPending}
      pagination={transactionsQuery.data?.pagination}
      onPageChange={setPage}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      filters={
        <>
          <Input
            type="date"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value)
              setPage(1)
            }}
            className="w-44"
          />
          <Input
            type="date"
            value={to}
            onChange={(event) => {
              setTo(event.target.value)
              setPage(1)
            }}
            className="w-44"
          />
          <Button asChild className="ml-auto">
            <Link to={create.url}>
              <Plus />
              {create.label}
            </Link>
          </Button>
        </>
      }
    />
  )
}
