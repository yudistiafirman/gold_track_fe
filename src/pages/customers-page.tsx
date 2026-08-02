import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/data-table/data-table'
import type { DataTableColumn } from '@/components/data-table/types'
import { Button } from '@/components/ui/button'
import { paginateMock } from '@/lib/paginate-mock'
import { useCan } from '@/lib/permissions'

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  totalTransactions: number
}

const MOCK_CUSTOMERS: Customer[] = [
  { id: '1', name: 'Siti Rahma', phone: '0812-3456-7890', email: 'siti@example.com', totalTransactions: 14 },
  { id: '2', name: 'Budi Santoso', phone: '0813-2233-4455', email: 'budi@example.com', totalTransactions: 3 },
  { id: '3', name: 'Dewi Lestari', phone: '0857-6677-8899', email: 'dewi@example.com', totalTransactions: 27 },
  { id: '4', name: 'Agus Wijaya', phone: '0821-1122-3344', email: 'agus@example.com', totalTransactions: 8 },
  { id: '5', name: 'Rina Marlina', phone: '0898-5566-7788', email: 'rina@example.com', totalTransactions: 1 },
  { id: '6', name: 'Hendra Gunawan', phone: '0811-9988-7766', email: 'hendra@example.com', totalTransactions: 19 },
  { id: '7', name: 'Yuni Kartika', phone: '0852-4433-2211', email: 'yuni@example.com', totalTransactions: 5 },
]

const PAGE_SIZE = 5

export function CustomersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const navigate = useNavigate()

  const canCreate = useCan('create', 'customers')
  const canUpdate = useCan('update', 'customers')
  const canDelete = useCan('delete', 'customers')

  const filtered = useMemo(
    () =>
      MOCK_CUSTOMERS.filter((customer) =>
        customer.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  )
  const { items, pagination } = paginateMock(filtered, page, PAGE_SIZE)

  const columns = useMemo(() => {
    const cols: DataTableColumn<Customer>[] = [
      { id: 'name', header: 'Nama', cell: (row) => row.name },
      { id: 'phone', header: 'Telepon', cell: (row) => row.phone, className: 'text-table-num' },
      { id: 'email', header: 'Email', cell: (row) => row.email },
      {
        id: 'totalTransactions',
        header: 'Total Transaksi',
        cell: (row) => row.totalTransactions,
        className: 'text-table-num',
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-h1 text-gray-900">Pelanggan</h1>
        {canCreate && (
          <Button onClick={() => navigate('/customers/new')}>
            <Plus />
            Tambah Pelanggan
          </Button>
        )}
      </div>
      <DataTable
        columns={columns}
        data={items}
        getRowId={(row) => row.id}
        pagination={pagination}
        onPageChange={setPage}
        search={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        searchPlaceholder="Cari pelanggan..."
        emptyTitle="Pelanggan tidak ditemukan"
      />
    </div>
  )
}
