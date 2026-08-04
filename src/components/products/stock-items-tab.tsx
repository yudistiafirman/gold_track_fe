import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Eye, Loader2, Pencil, Plus, Printer, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DataTable } from '@/components/data-table/data-table'
import type { DataTableColumn, PaginationMeta } from '@/components/data-table/types'
import { CreateStockItemDialog } from '@/components/products/create-stock-item-dialog'
import { DeleteStockItemDialog } from '@/components/products/delete-stock-item-dialog'
import { EditStockItemDialog } from '@/components/products/edit-stock-item-dialog'
import { StockItemDetailDialog } from '@/components/products/stock-item-detail-dialog'
import { type RowAction, RowActionsMenu } from '@/components/row-actions-menu'
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
import {
  usePrintStockItemLabel,
  usePrintStockItemLabels,
} from '@/hooks/use-print-stock-item-label'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import {
  STOCK_CONDITION_TONE,
  STOCK_STATUS_TONE,
  type StockCondition,
  type StockStatus,
} from '@/lib/domain-status'
import { formatCurrency, formatDate } from '@/lib/format'
import { useCan } from '@/lib/permissions'
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
  const [editingStockItemId, setEditingStockItemId] = useState<string | null>(null)
  const [deletingStockItem, setDeletingStockItem] = useState<{
    id: string
    serialNumber: string
    productId: string
  } | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const debouncedSearch = useDebouncedValue(search, 400)
  const canCreate = useCan('create', 'stock-items')
  const canUpdate = useCan('update', 'stock-items')
  const canDelete = useCan('delete', 'stock-items')
  const printLabelMutation = usePrintStockItemLabel()
  const printLabelsMutation = usePrintStockItemLabels()

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
        id: 'production_year',
        header: 'Tahun Produksi',
        cell: (row) => row.production_year ?? '—',
        className: 'text-table-num',
      },
      {
        id: 'actions',
        header: '',
        className: 'w-0',
        cell: (row) => {
          const isPrinting =
            printLabelMutation.isPending && printLabelMutation.variables === row.id
          const actions: RowAction[] = [
            {
              label: 'Lihat Detail',
              icon: Eye,
              onClick: () => setViewingStockItemId(row.id),
            },
            {
              label: isPrinting ? 'Mencetak...' : 'Cetak Label',
              icon: isPrinting ? Loader2 : Printer,
              iconClassName: isPrinting ? 'animate-spin' : undefined,
              disabled: isPrinting,
              onClick: () => printLabelMutation.mutate(row.id),
            },
            ...(canUpdate
              ? [
                  {
                    label: 'Edit',
                    icon: Pencil,
                    onClick: () => setEditingStockItemId(row.id),
                  },
                ]
              : []),
            ...(canDelete
              ? [
                  {
                    label: 'Hapus',
                    icon: Trash2,
                    variant: 'destructive' as const,
                    disabled: row.status !== 'AVAILABLE',
                    title:
                      row.status !== 'AVAILABLE'
                        ? 'Hanya unit AVAILABLE yang bisa dihapus'
                        : undefined,
                    onClick: () =>
                      setDeletingStockItem({
                        id: row.id,
                        serialNumber: row.serial_number,
                        productId: row.product.id,
                      }),
                  },
                ]
              : []),
          ]
          return <RowActionsMenu actions={actions} ariaLabel={`Aksi untuk ${row.serial_number}`} />
        },
      },
    ],
    [canUpdate, canDelete, printLabelMutation],
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
      <div className="flex items-center justify-between">
        <h2 className="text-h3 text-gray-900">Unit Stok</h2>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="secondary"
              disabled={printLabelsMutation.isPending}
              onClick={() => {
                printLabelsMutation.mutate(Array.from(selectedIds))
                setSelectedIds(new Set())
              }}
            >
              {printLabelsMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Printer />
              )}
              Cetak Label Terpilih ({selectedIds.size})
            </Button>
          )}
          {canCreate && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus />
              Tambah Unit Stok
            </Button>
          )}
        </div>
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
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
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
      <EditStockItemDialog
        stockItemId={editingStockItemId}
        onClose={() => setEditingStockItemId(null)}
      />
      <DeleteStockItemDialog
        stockItem={deletingStockItem}
        onClose={() => setDeletingStockItem(null)}
      />
      <CreateStockItemDialog
        productId={productId}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  )
}
