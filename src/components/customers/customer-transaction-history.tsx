import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DataTable } from '@/components/data-table/data-table'
import type { DataTableColumn, PaginationMeta } from '@/components/data-table/types'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import { formatCurrency, formatDate } from '@/lib/format'
import type { CustomerTransaction, CustomerTransactionType } from '@/types/customer-transaction'

interface CustomerTransactionListResponse {
  items: CustomerTransaction[]
  pagination: PaginationMeta
}

const PAGE_SIZE = 10

const TYPE_LABELS: Record<CustomerTransactionType, string> = {
  SELL: 'Penjualan',
  BUY: 'Buyback',
}

const columns: DataTableColumn<CustomerTransaction>[] = [
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
    id: 'type',
    header: 'Tipe',
    cell: (row) => (
      <Badge variant={row.type === 'SELL' ? 'default' : 'outline'}>{TYPE_LABELS[row.type]}</Badge>
    ),
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
    cell: (row) => row.status,
  },
]

interface CustomerTransactionHistoryProps {
  customerId: string
}

export function CustomerTransactionHistory({ customerId }: CustomerTransactionHistoryProps) {
  const [page, setPage] = useState(1)

  const transactionsQuery = useQuery({
    queryKey: ['customers', customerId, 'transactions', { page }],
    queryFn: () =>
      api.get<CustomerTransactionListResponse>(`/customers/${customerId}/transactions`, {
        params: { page, limit: PAGE_SIZE },
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

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-h3 text-gray-900">Riwayat Transaksi</h2>
      <DataTable
        columns={columns}
        data={transactionsQuery.data?.items ?? []}
        getRowId={(row) => row.id}
        isLoading={transactionsQuery.isPending}
        pagination={transactionsQuery.data?.pagination}
        onPageChange={setPage}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />
    </div>
  )
}
