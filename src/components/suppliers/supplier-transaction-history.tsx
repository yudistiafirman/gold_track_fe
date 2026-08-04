import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Receipt } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DataTable } from '@/components/data-table/data-table'
import type { DataTableColumn, PaginationMeta } from '@/components/data-table/types'
import { StatusBadge } from '@/components/status-badge'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import { PO_STATUS_TONE, resolveStatusTone, TRANSACTION_STATUS_TONE } from '@/lib/domain-status'
import { formatCurrency, formatDate } from '@/lib/format'
import type { SupplierTransactionRow } from '@/types/supplier-transaction'

interface SupplierTransactionListResponse {
  items: SupplierTransactionRow[]
  pagination: PaginationMeta
}

const PAGE_SIZE = 10

const SOURCE_LABEL: Record<SupplierTransactionRow['source'], string> = {
  PURCHASE_ORDER: 'Pembelian',
  SELL_SUPPLIER: 'Jual Balik',
}

function getDetailPath(row: SupplierTransactionRow): string {
  return row.source === 'PURCHASE_ORDER'
    ? `/purchase-orders/${row.id}`
    : `/transactions/${row.id}`
}

const columns: DataTableColumn<SupplierTransactionRow>[] = [
  {
    id: 'code',
    header: 'Kode',
    cell: (row) => (
      <Link
        to={getDetailPath(row)}
        className="text-table-num text-gray-900 hover:text-primary hover:underline"
      >
        {row.code}
      </Link>
    ),
  },
  {
    id: 'source',
    header: 'Tipe',
    cell: (row) => (
      <Badge variant={row.source === 'PURCHASE_ORDER' ? 'default' : 'outline'}>
        {SOURCE_LABEL[row.source]}
      </Badge>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => {
      const tone = resolveStatusTone(
        row.source === 'PURCHASE_ORDER' ? PO_STATUS_TONE : TRANSACTION_STATUS_TONE,
        row.status,
      )
      return <StatusBadge tone={tone} label={row.status} />
    },
  },
  {
    id: 'total_amount',
    header: 'Total',
    cell: (row) => formatCurrency(row.total_amount),
    className: 'text-table-num',
  },
  {
    id: 'created_at',
    header: 'Tanggal',
    cell: (row) => formatDate(row.created_at),
  },
]

interface SupplierTransactionHistoryProps {
  supplierId: string
}

export function SupplierTransactionHistory({ supplierId }: SupplierTransactionHistoryProps) {
  const [page, setPage] = useState(1)

  const transactionsQuery = useQuery({
    queryKey: ['suppliers', supplierId, 'transactions', { page }],
    queryFn: () =>
      api.get<SupplierTransactionListResponse>(`/suppliers/${supplierId}/transactions`, {
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
      <div className="flex items-center gap-2.5">
        <div className="flex size-7 items-center justify-center rounded-lg bg-gray-100">
          <Receipt className="size-4 text-gray-600" />
        </div>
        <h2 className="text-h3 text-gray-900">Riwayat Transaksi</h2>
      </div>
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
