import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DataTable } from '@/components/data-table/data-table'
import type { DataTableColumn } from '@/components/data-table/types'
import { CreateExternalDebtDialog } from '@/components/external-debts/create-external-debt-dialog'
import { DeleteExternalDebtDialog } from '@/components/external-debts/delete-external-debt-dialog'
import { EditExternalDebtDialog } from '@/components/external-debts/edit-external-debt-dialog'
import { type RowAction, RowActionsMenu } from '@/components/row-actions-menu'
import { Button } from '@/components/ui/button'
import { useExternalDebts } from '@/hooks/use-external-debts'
import { ApiError } from '@/lib/api/error'
import { formatCurrency } from '@/lib/format'
import type { ExternalDebt } from '@/types/external-debt'

export function ExternalDebtsPage() {
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingDebt, setDeletingDebt] = useState<{ id: string; debtor_name: string } | null>(
    null,
  )

  const debtsQuery = useExternalDebts()

  const filteredDebts = useMemo(() => {
    const items = debtsQuery.data ?? []
    const lowerSearch = search.trim().toLowerCase()
    if (!lowerSearch) return items
    return items.filter((item) => item.debtor_name.toLowerCase().includes(lowerSearch))
  }, [debtsQuery.data, search])

  const columns: DataTableColumn<ExternalDebt>[] = [
    { id: 'debtor_name', header: 'Nama Peminjam', cell: (row) => row.debtor_name },
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
            onClick: () => setDeletingDebt({ id: row.id, debtor_name: row.debtor_name }),
          },
        ]
        return <RowActionsMenu actions={actions} ariaLabel={`Aksi untuk ${row.debtor_name}`} />
      },
    },
  ]

  const isError = debtsQuery.isError
  const emptyTitle = isError ? 'Gagal memuat data' : 'Belum ada hutang diluar'
  const emptyDescription = isError
    ? debtsQuery.error instanceof ApiError
      ? debtsQuery.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : undefined

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-h1 text-gray-900">Hutang Diluar</h1>
        <p className="text-caption text-gray-500">
          Piutang orang yang pinjam uang dari toko. Cicilan = edit nominal turun. Lunas? Hapus
          barisnya.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={filteredDebts}
        getRowId={(row) => row.id}
        isLoading={debtsQuery.isPending}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari nama peminjam..."
        filters={
          <Button onClick={() => setCreateOpen(true)} className="ml-auto">
            <Plus />
            Tambah
          </Button>
        }
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />

      <CreateExternalDebtDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditExternalDebtDialog debtId={editingId} onClose={() => setEditingId(null)} />
      <DeleteExternalDebtDialog debt={deletingDebt} onClose={() => setDeletingDebt(null)} />
    </div>
  )
}
