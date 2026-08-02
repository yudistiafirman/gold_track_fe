import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/data-table/data-table'
import type { DataTableColumn, PaginationMeta } from '@/components/data-table/types'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import { useCan } from '@/lib/permissions'

interface ProductRef {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  sku: string
  category: ProductRef
  brand: ProductRef
  weight_gram: number
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ProductListResponse {
  items: Product[]
  pagination: PaginationMeta
}

const PAGE_SIZE = 10

export function ProductsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const navigate = useNavigate()
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
      { id: 'name', header: 'Nama Produk', cell: (row) => row.name },
      { id: 'category', header: 'Kategori', cell: (row) => row.category.name },
      { id: 'brand', header: 'Brand', cell: (row) => row.brand.name },
      {
        id: 'weight',
        header: 'Berat',
        cell: (row) => `${row.weight_gram} gr`,
        className: 'text-table-num',
      },
      {
        id: 'is_active',
        header: 'Status',
        cell: (row) => (
          <StatusBadge
            tone={row.is_active ? 'success' : 'gray'}
            label={row.is_active ? 'Aktif' : 'Nonaktif'}
          />
        ),
      },
    ]

    if (canUpdate || canDelete) {
      cols.push({
        id: 'actions',
        header: '',
        className: 'w-0',
        cell: (row) => (
          <div className="flex justify-end gap-1">
            {canUpdate && (
              <Button variant="ghost" size="icon-sm" aria-label={`Edit ${row.name}`}>
                <Pencil />
              </Button>
            )}
            {canDelete && (
              <Button variant="ghost" size="icon-sm" aria-label={`Hapus ${row.name}`}>
                <Trash2 className="text-error" />
              </Button>
            )}
          </div>
        ),
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
      <div className="flex items-center justify-between">
        <h1 className="text-h1 text-gray-900">Produk</h1>
        {canCreate && (
          <Button onClick={() => navigate('/products/new')}>
            <Plus />
            Tambah Produk
          </Button>
        )}
      </div>
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
        searchPlaceholder="Cari produk (nama/SKU)..."
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />
    </div>
  )
}
