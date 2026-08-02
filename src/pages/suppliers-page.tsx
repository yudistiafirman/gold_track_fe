import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DataTable } from '@/components/data-table/data-table'
import type { DataTableColumn, PaginationMeta } from '@/components/data-table/types'
import { CreateSupplierDialog } from '@/components/suppliers/create-supplier-dialog'
import { DeleteSupplierDialog } from '@/components/suppliers/delete-supplier-dialog'
import { EditSupplierDialog } from '@/components/suppliers/edit-supplier-dialog'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import { useCan } from '@/lib/permissions'
import type { Supplier } from '@/types/supplier'

interface SupplierListResponse {
  items: Supplier[]
  pagination: PaginationMeta
}

const PAGE_SIZE = 10

export function SuppliersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null)
  const [deletingSupplier, setDeletingSupplier] = useState<{ id: string; name: string } | null>(
    null,
  )
  const debouncedSearch = useDebouncedValue(search, 400)

  const canCreate = useCan('create', 'suppliers')
  const canUpdate = useCan('update', 'suppliers')
  const canDelete = useCan('delete', 'suppliers')

  const suppliersQuery = useQuery({
    queryKey: ['suppliers', { search: debouncedSearch, page }],
    queryFn: () =>
      api.get<SupplierListResponse>('/suppliers', {
        params: { search: debouncedSearch || undefined, page, limit: PAGE_SIZE },
      }),
    placeholderData: keepPreviousData,
  })

  const columns = useMemo(() => {
    const cols: DataTableColumn<Supplier>[] = [
      { id: 'name', header: 'Nama Supplier', cell: (row) => row.name },
      {
        id: 'phone',
        header: 'Telepon',
        cell: (row) => row.phone ?? '—',
        className: 'text-table-num',
      },
      { id: 'address', header: 'Alamat', cell: (row) => row.address ?? '—' },
      {
        id: 'notes',
        header: 'Catatan',
        className: 'max-w-50',
        cell: (row) =>
          row.notes ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="block truncate">{row.notes}</span>
              </TooltipTrigger>
              <TooltipContent>{row.notes}</TooltipContent>
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
        cell: (row) => (
          <div className="flex justify-end gap-1">
            {canUpdate && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Edit ${row.name}`}
                onClick={() => setEditingSupplierId(row.id)}
              >
                <Pencil />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Hapus ${row.name}`}
                onClick={() => setDeletingSupplier({ id: row.id, name: row.name })}
              >
                <Trash2 className="text-error" />
              </Button>
            )}
          </div>
        ),
      })
    }

    return cols
  }, [canUpdate, canDelete])

  const isError = suppliersQuery.isError
  const emptyTitle = isError ? 'Gagal memuat supplier' : 'Supplier tidak ditemukan'
  const emptyDescription = isError
    ? suppliersQuery.error instanceof ApiError
      ? suppliersQuery.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : undefined

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-h1 text-gray-900">Supplier</h1>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus />
            Tambah Supplier
          </Button>
        )}
      </div>
      <DataTable
        columns={columns}
        data={suppliersQuery.data?.items ?? []}
        getRowId={(row) => row.id}
        isLoading={suppliersQuery.isPending}
        pagination={suppliersQuery.data?.pagination}
        onPageChange={setPage}
        search={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        searchPlaceholder="Cari supplier..."
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />
      <CreateSupplierDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditSupplierDialog
        supplierId={editingSupplierId}
        onClose={() => setEditingSupplierId(null)}
      />
      <DeleteSupplierDialog
        supplier={deletingSupplier}
        onClose={() => setDeletingSupplier(null)}
      />
    </div>
  )
}
