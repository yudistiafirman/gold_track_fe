import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DataTable } from '@/components/data-table/data-table'
import type { DataTableColumn, PaginationMeta } from '@/components/data-table/types'
import { ArchiveProductDialog } from '@/components/products/archive-product-dialog'
import { CreateProductDialog } from '@/components/products/create-product-dialog'
import { EditProductDialog } from '@/components/products/edit-product-dialog'
import { type RowAction, RowActionsMenu } from '@/components/row-actions-menu'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import { useCan } from '@/lib/permissions'
import type { Product } from '@/types/product'

interface ProductListResponse {
  items: Product[]
  pagination: PaginationMeta
}

const PAGE_SIZE = 10

export function ProductsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [archivingProduct, setArchivingProduct] = useState<{ id: string; name: string } | null>(
    null,
  )
  const debouncedSearch = useDebouncedValue(search, 400)

  const canCreate = useCan('create', 'products')
  const canUpdate = useCan('update', 'products')
  const canDelete = useCan('delete', 'products')

  const productsQuery = useQuery({
    queryKey: ['products', { search: debouncedSearch, page }],
    queryFn: () =>
      api.get<ProductListResponse>('/products', {
        params: { search: debouncedSearch || undefined, page, limit: PAGE_SIZE },
      }),
    placeholderData: keepPreviousData,
  })

  const columns = useMemo(() => {
    const cols: DataTableColumn<Product>[] = [
      { id: 'sku', header: 'SKU', cell: (row) => row.sku, className: 'text-table-num' },
      {
        id: 'name',
        header: 'Nama Produk',
        cell: (row) => (
          <Link to={`/products/${row.id}`} className="font-medium text-gray-900 hover:text-primary">
            {row.name}
          </Link>
        ),
      },
      { id: 'category', header: 'Kategori', cell: (row) => row.category.name },
      { id: 'brand', header: 'Brand', cell: (row) => row.brand.name },
      {
        id: 'weight',
        header: 'Berat',
        cell: (row) => `${row.weight_gram} gr`,
        className: 'text-table-num',
      },
      {
        id: 'description',
        header: 'Deskripsi',
        className: 'max-w-50',
        cell: (row) =>
          row.description ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="block truncate">{row.description}</span>
              </TooltipTrigger>
              <TooltipContent>{row.description}</TooltipContent>
            </Tooltip>
          ) : (
            '—'
          ),
      },
    ]

    if (canUpdate || canDelete) {
      cols.push({
        id: 'actions',
        header: '',
        className: 'w-0',
        cell: (row) => {
          const actions: RowAction[] = [
            ...(canUpdate
              ? [{ label: 'Edit', icon: Pencil, onClick: () => setEditingProductId(row.id) }]
              : []),
            ...(canDelete
              ? [
                  {
                    label: 'Arsipkan',
                    icon: Trash2,
                    variant: 'destructive' as const,
                    onClick: () => setArchivingProduct({ id: row.id, name: row.name }),
                  },
                ]
              : []),
          ]
          return <RowActionsMenu actions={actions} ariaLabel={`Aksi untuk ${row.name}`} />
        },
      })
    }

    return cols
  }, [canUpdate, canDelete])

  const isError = productsQuery.isError
  const emptyTitle = isError ? 'Gagal memuat produk' : 'Produk tidak ditemukan'
  const emptyDescription = isError
    ? productsQuery.error instanceof ApiError
      ? productsQuery.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : undefined

  return (
    <div className="flex flex-col gap-6">
      {canCreate && (
        <div className="flex justify-end">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus />
            Tambah Produk
          </Button>
        </div>
      )}
      <DataTable
        columns={columns}
        data={productsQuery.data?.items ?? []}
        getRowId={(row) => row.id}
        isLoading={productsQuery.isPending}
        pagination={productsQuery.data?.pagination}
        onPageChange={setPage}
        search={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        searchPlaceholder="Cari nama produk..."
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />
      <CreateProductDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditProductDialog
        productId={editingProductId}
        onClose={() => setEditingProductId(null)}
      />
      <ArchiveProductDialog
        product={archivingProduct}
        onClose={() => setArchivingProduct(null)}
      />
    </div>
  )
}
