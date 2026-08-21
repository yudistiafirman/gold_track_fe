import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DataTable } from '@/components/data-table/data-table'
import type { DataTableColumn, PaginationMeta } from '@/components/data-table/types'
import { StatusBadge } from '@/components/status-badge'
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
import { STOCK_CONDITION_TONE, type StockCondition } from '@/lib/domain-status'
import { formatCurrency, formatDate } from '@/lib/format'
import type { StockItem } from '@/types/stock-item'

interface StockItemListResponse {
  items: StockItem[]
  pagination: PaginationMeta
}

const PAGE_SIZE = 10

const CONDITION_OPTIONS: { value: StockCondition | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Semua kondisi' },
  { value: 'GOOD', label: 'Good' },
  { value: 'BAD', label: 'Bad' },
]

export function SoldStockItemsPage() {
  const [search, setSearch] = useState('')
  const [condition, setCondition] = useState<StockCondition | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search, 400)

  const stockItemsQuery = useQuery({
    queryKey: ['stock-items', 'sold', { search: debouncedSearch, condition, page }],
    queryFn: () =>
      api.get<StockItemListResponse>('/stock-items', {
        params: {
          status: 'SOLD',
          search: debouncedSearch || undefined,
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
        id: 'product',
        header: 'Produk',
        cell: (row) => (
          <Link
            to={`/products/${row.product.id}`}
            className="font-medium text-gray-900 hover:text-primary"
          >
            {row.product.name}
          </Link>
        ),
      },
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
        id: 'purchase_price',
        header: 'Harga Beli',
        cell: (row) => formatCurrency(row.purchase_price),
        className: 'text-table-num',
      },
      {
        id: 'sold_at',
        header: 'Tanggal Terjual',
        cell: (row) => (row.sold_at ? formatDate(row.sold_at) : '—'),
      },
      {
        id: 'sold_to',
        header: 'Terjual ke',
        cell: (row) =>
          row.sold_to ? (
            <div className="flex items-center gap-2">
              <span className="text-gray-900">{row.sold_to.name}</span>
              <StatusBadge
                tone={row.sold_to.type === 'CUSTOMER' ? 'success' : 'warning'}
                label={row.sold_to.type === 'CUSTOMER' ? 'Pelanggan' : 'Supplier'}
              />
            </div>
          ) : (
            '—'
          ),
      },
    ],
    [],
  )

  const isError = stockItemsQuery.isError
  const emptyTitle = isError ? 'Gagal memuat barang terjual' : 'Belum ada barang terjual'
  const emptyDescription = isError
    ? stockItemsQuery.error instanceof ApiError
      ? stockItemsQuery.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : undefined

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h1 text-gray-900">Barang Terjual</h1>
        <p className="text-caption text-gray-500">
          Daftar unit stok yang sudah terjual di seluruh produk.
        </p>
      </div>
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
        }
      />
    </div>
  )
}
