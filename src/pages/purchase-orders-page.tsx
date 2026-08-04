import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
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
import { PO_STATUS_TONE, resolveStatusTone } from '@/lib/domain-status'
import { formatCurrency, formatDate } from '@/lib/format'
import type { PurchaseOrder, PurchaseOrderStatus } from '@/types/purchase-order'

interface PurchaseOrderListResponse {
  items: PurchaseOrder[]
  pagination: PaginationMeta
}

const PAGE_SIZE = 10

const STATUS_OPTIONS: { value: PurchaseOrderStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Semua status' },
  { value: 'BELUM_DITERIMA', label: 'Belum Diterima' },
  { value: 'DITERIMA', label: 'Diterima' },
  { value: 'DIBATALKAN', label: 'Dibatalkan' },
]

const columns: DataTableColumn<PurchaseOrder>[] = [
  {
    id: 'po_code',
    header: 'Kode PO',
    cell: (row) => (
      <Link
        to={`/purchase-orders/${row.id}`}
        className="text-table-num text-gray-900 hover:text-primary hover:underline"
      >
        {row.po_code}
      </Link>
    ),
  },
  {
    id: 'supplier',
    header: 'Supplier',
    cell: (row) => row.supplier.name,
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => (
      <StatusBadge tone={resolveStatusTone(PO_STATUS_TONE, row.status)} label={row.status} />
    ),
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

export function PurchaseOrdersPage() {
  const [status, setStatus] = useState<PurchaseOrderStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(1)

  const purchaseOrdersQuery = useQuery({
    queryKey: ['purchase-orders', { status, page }],
    queryFn: () =>
      api.get<PurchaseOrderListResponse>('/purchase-orders', {
        params: { status: status === 'ALL' ? undefined : status, page, limit: PAGE_SIZE },
      }),
    placeholderData: keepPreviousData,
  })

  const isError = purchaseOrdersQuery.isError
  const emptyTitle = isError ? 'Gagal memuat purchase order' : 'Belum ada purchase order'
  const emptyDescription = isError
    ? purchaseOrdersQuery.error instanceof ApiError
      ? purchaseOrdersQuery.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : undefined

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h1 text-gray-900">Purchase Order</h1>
        <p className="text-caption text-gray-500">Kelola pesanan pembelian ke supplier.</p>
      </div>
      <DataTable
        columns={columns}
        data={purchaseOrdersQuery.data?.items ?? []}
        getRowId={(row) => row.id}
        isLoading={purchaseOrdersQuery.isPending}
        pagination={purchaseOrdersQuery.data?.pagination}
        onPageChange={setPage}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        filters={
          <>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as PurchaseOrderStatus | 'ALL')
                setPage(1)
              }}
            >
              <SelectTrigger className="w-48">
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
            <Button asChild className="ml-auto">
              <Link to="/purchase-orders/new">
                <Plus />
                Buat PO
              </Link>
            </Button>
          </>
        }
      />
    </div>
  )
}
