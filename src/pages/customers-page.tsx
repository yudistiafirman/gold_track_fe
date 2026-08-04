import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DataTable } from '@/components/data-table/data-table'
import type { DataTableColumn, PaginationMeta } from '@/components/data-table/types'
import { CreateCustomerDialog } from '@/components/customers/create-customer-dialog'
import { DeleteCustomerDialog } from '@/components/customers/delete-customer-dialog'
import { EditCustomerDialog } from '@/components/customers/edit-customer-dialog'
import { type RowAction, RowActionsMenu } from '@/components/row-actions-menu'
import { Button } from '@/components/ui/button'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import { useCan } from '@/lib/permissions'
import type { Customer } from '@/types/customer'

interface CustomerListResponse {
  items: Customer[]
  pagination: PaginationMeta
}

const PAGE_SIZE = 10

export function CustomersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null)
  const [deletingCustomer, setDeletingCustomer] = useState<{ id: string; name: string } | null>(
    null,
  )
  const debouncedSearch = useDebouncedValue(search, 400)

  const canCreate = useCan('create', 'customers')
  const canUpdate = useCan('update', 'customers')
  const canDelete = useCan('delete', 'customers')

  const customersQuery = useQuery({
    queryKey: ['customers', { search: debouncedSearch, page }],
    queryFn: () =>
      api.get<CustomerListResponse>('/customers', {
        params: { search: debouncedSearch || undefined, page, limit: PAGE_SIZE },
      }),
    placeholderData: keepPreviousData,
  })

  const columns = useMemo(() => {
    const cols: DataTableColumn<Customer>[] = [
      {
        id: 'name',
        header: 'Nama',
        cell: (row) => (
          <Link to={`/customers/${row.id}`} className="font-medium text-gray-900 hover:text-primary">
            {row.name}
          </Link>
        ),
      },
      {
        id: 'phone',
        header: 'Telepon',
        cell: (row) => row.phone ?? '—',
        className: 'text-table-num',
      },
      { id: 'email', header: 'Email', cell: (row) => row.email ?? '—' },
    ]

    if (canUpdate || canDelete) {
      cols.push({
        id: 'actions',
        header: '',
        className: 'w-0',
        cell: (row) => {
          const actions: RowAction[] = [
            ...(canUpdate
              ? [{ label: 'Edit', icon: Pencil, onClick: () => setEditingCustomerId(row.id) }]
              : []),
            ...(canDelete
              ? [
                  {
                    label: 'Hapus',
                    icon: Trash2,
                    variant: 'destructive' as const,
                    onClick: () => setDeletingCustomer({ id: row.id, name: row.name }),
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

  const isError = customersQuery.isError
  const emptyTitle = isError ? 'Gagal memuat pelanggan' : 'Pelanggan tidak ditemukan'
  const emptyDescription = isError
    ? customersQuery.error instanceof ApiError
      ? customersQuery.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : undefined

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h1 text-gray-900">Pelanggan</h1>
        <p className="text-caption text-gray-500">Kelola data pelanggan toko.</p>
      </div>
      <DataTable
        columns={columns}
        data={customersQuery.data?.items ?? []}
        getRowId={(row) => row.id}
        isLoading={customersQuery.isPending}
        pagination={customersQuery.data?.pagination}
        onPageChange={setPage}
        search={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        searchPlaceholder="Cari nama/HP..."
        filters={
          canCreate && (
            <Button onClick={() => setCreateOpen(true)} className="ml-auto">
              <Plus />
              Tambah Pelanggan
            </Button>
          )
        }
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />
      <CreateCustomerDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditCustomerDialog
        customerId={editingCustomerId}
        onClose={() => setEditingCustomerId(null)}
      />
      <DeleteCustomerDialog
        customer={deletingCustomer}
        onClose={() => setDeletingCustomer(null)}
      />
    </div>
  )
}
