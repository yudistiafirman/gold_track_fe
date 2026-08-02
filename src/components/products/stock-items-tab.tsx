import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Eye } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DataTable } from '@/components/data-table/data-table'
import type { DataTableColumn, PaginationMeta } from '@/components/data-table/types'
import { StockItemDetailDialog } from '@/components/products/stock-item-detail-dialog'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import {
  STOCK_CONDITION_TONE,
  STOCK_STATUS_TONE,
  type StockCondition,
  type StockStatus,
} from '@/lib/domain-status'
import { formatCurrency, formatDate } from '@/lib/format'
import type { StockItem } from '@/types/stock-item'

interface StockItemListResponse {
  items: StockItem[]
  pagination: PaginationMeta
}

const PAGE_SIZE = 10

const STATUS_OPTIONS: { value: StockStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Semua status' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'SOLD', label: 'Sold' },
]

const CONDITION_OPTIONS: { value: StockCondition | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Semua kondisi' },
  { value: 'GOOD', label: 'Good' },
  { value: 'BAD', label: 'Bad' },
]

interface StockItemsTabProps {
  productId: string
}

export function StockItemsTab({ productId }: StockItemsTabProps) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StockStatus | 'ALL'>('ALL')
  const [condition, setCondition] = useState<StockCondition | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const [viewingStockItemId, setViewingStockItemId] = useState<string | null>(null)
  const debouncedSearch = useDebouncedValue(search, 400)

  const stockItemsQuery = useQuery({
    queryKey: [
      'products',
      productId,
      'stock-items',
      { search: debouncedSearch, status, condition, page },
    ],
    queryFn: () =>
      api.get<StockItemListResponse>(`/products/${productId}/stock-items`, {
        params: {
          search: debouncedSearch || undefined,
          status: status === 'ALL' ? undefined : status,
          condition: condition === 'ALL' ? undefined : condition,
          page,
          limit: PAGE_SIZE,
        },
      }),
    placeholderData: keepPreviousData,
  })

  const columns = useMemo<DataTableColumn<StockItem>[]>(
    () => [
      {
        id: 'barcode',
        header: 'Barcode',
        cell: (row) => row.barcode,
        className: 'text-table-num',
      },
      {
        id: 'serial_number',
        header: 'Serial Number',
        cell: (row) => row.serial_number,
        className: 'text-table-num',
      },
      {
        id: 'condition',
        header: 'Kondisi',
        cell: (row) => (
          <StatusBadge tone={STOCK_CONDITION_TONE[row.condition]} label={row.condition} />
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row) => <StatusBadge tone={STOCK_STATUS_TONE[row.status]} label={row.status} />,
      },
      {
        id: 'purchase_price',
        header: 'Harga Beli',
        cell: (row) => formatCurrency(row.purchase_price),
        className: 'text-table-num',
      },
      {
        id: 'purchase_date',
        header: 'Tanggal Beli',
        cell: (row) => formatDate(row.purchase_date),
      },
      {
        id: 'actions',
        header: '',
        className: 'w-0',
        cell: (row) => (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Lihat detail ${row.serial_number}`}
            onClick={() => setViewingStockItemId(row.id)}
          >
            <Eye />
          </Button>
        ),
      },
    ],
    [],
  )

  const isError = stockItemsQuery.isError
  const emptyTitle = isError ? 'Gagal memuat stok' : 'Belum ada unit stok'
  const emptyDescription = isError
    ? stockItemsQuery.error instanceof ApiError
      ? stockItemsQuery.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : undefined

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        columns={columns}
        data={stockItemsQuery.data?.items ?? []}
        getRowId={(row) => row.id}
        isLoading={stockItemsQuery.isPending}
        pagination={stockItemsQuery.data?.pagination}
        onPageChange={setPage}
        search={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        searchPlaceholder="Cari serial number..."
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        filters={
          <div className="flex gap-2">
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as StockStatus | 'ALL')
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

            <Select
              value={condition}
              onValueChange={(value) => {
                setCondition(value as StockCondition | 'ALL')
                setPage(1)
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />
      <StockItemDetailDialog
        stockItemId={viewingStockItemId}
        onClose={() => setViewingStockItemId(null)}
      />
    </div>
  )
}
