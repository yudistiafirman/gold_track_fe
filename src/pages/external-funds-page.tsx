import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DataTable } from '@/components/data-table/data-table'
import type { DataTableColumn } from '@/components/data-table/types'
import { CreateExternalFundDialog } from '@/components/external-funds/create-external-fund-dialog'
import { DeleteExternalFundDialog } from '@/components/external-funds/delete-external-fund-dialog'
import { EditExternalFundDialog } from '@/components/external-funds/edit-external-fund-dialog'
import { type RowAction, RowActionsMenu } from '@/components/row-actions-menu'
import { Button } from '@/components/ui/button'
import { useExternalFunds } from '@/hooks/use-external-funds'
import { ApiError } from '@/lib/api/error'
import { formatCurrency } from '@/lib/format'
import type { ExternalFund } from '@/types/external-fund'

export function ExternalFundsPage() {
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingFund, setDeletingFund] = useState<{ id: string; description: string } | null>(
    null,
  )

  const fundsQuery = useExternalFunds()

  const filteredFunds = useMemo(() => {
    const items = fundsQuery.data ?? []
    const lowerSearch = search.trim().toLowerCase()
    if (!lowerSearch) return items
    return items.filter((item) => item.description.toLowerCase().includes(lowerSearch))
  }, [fundsQuery.data, search])

  const columns: DataTableColumn<ExternalFund>[] = [
    { id: 'description', header: 'Keterangan', cell: (row) => row.description },
    {
      id: 'amount',
      header: 'Nominal',
      className: 'text-right',
      cell: (row) => <span className="text-table-num">{formatCurrency(row.amount)}</span>,
    },
    {
      id: 'actions',
      header: '',
      className: 'w-0',
      cell: (row) => {
        const actions: RowAction[] = [
          { label: 'Edit', icon: Pencil, onClick: () => setEditingId(row.id) },
          {
            label: 'Hapus',
            icon: Trash2,
            variant: 'destructive',
            onClick: () => setDeletingFund({ id: row.id, description: row.description }),
          },
        ]
        return <RowActionsMenu actions={actions} ariaLabel={`Aksi untuk ${row.description}`} />
      },
    },
  ]

  const isError = fundsQuery.isError
  const emptyTitle = isError ? 'Gagal memuat data' : 'Belum ada uang diluar'
  const emptyDescription = isError
    ? fundsQuery.error instanceof ApiError
      ? fundsQuery.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : undefined

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-h1 text-gray-900">Uang Diluar</h1>
        <p className="text-caption text-gray-500">
          Uang yang lagi di lapangan/belum settle. Sudah kembali? Hapus barisnya.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={filteredFunds}
        getRowId={(row) => row.id}
        isLoading={fundsQuery.isPending}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari keterangan..."
        filters={
          <Button onClick={() => setCreateOpen(true)} className="ml-auto">
            <Plus />
            Tambah
          </Button>
        }
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />

      <CreateExternalFundDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditExternalFundDialog fundId={editingId} onClose={() => setEditingId(null)} />
      <DeleteExternalFundDialog fund={deletingFund} onClose={() => setDeletingFund(null)} />
    </div>
  )
}
