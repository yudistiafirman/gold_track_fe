import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CreateBalanceAccountDialog } from '@/components/balance-accounts/create-balance-account-dialog'
import { DeleteBalanceAccountDialog } from '@/components/balance-accounts/delete-balance-account-dialog'
import { EditBalanceAccountDialog } from '@/components/balance-accounts/edit-balance-account-dialog'
import { DataTable } from '@/components/data-table/data-table'
import type { DataTableColumn } from '@/components/data-table/types'
import { type RowAction, RowActionsMenu } from '@/components/row-actions-menu'
import { Button } from '@/components/ui/button'
import { useBalanceAccounts } from '@/hooks/use-balance-accounts'
import { ApiError } from '@/lib/api/error'
import { formatCurrency } from '@/lib/format'
import type { BalanceAccount } from '@/types/balance-account'

export function BalanceAccountsPage() {
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingAccount, setDeletingAccount] = useState<{ id: string; name: string } | null>(
    null,
  )

  const accountsQuery = useBalanceAccounts()

  const filteredAccounts = useMemo(() => {
    const items = accountsQuery.data ?? []
    const lowerSearch = search.trim().toLowerCase()
    if (!lowerSearch) return items
    return items.filter((item) => item.name.toLowerCase().includes(lowerSearch))
  }, [accountsQuery.data, search])

  const columns: DataTableColumn<BalanceAccount>[] = [
    { id: 'name', header: 'Nama', cell: (row) => row.name },
    {
      id: 'balance',
      header: 'Saldo',
      className: 'text-right',
      cell: (row) => <span className="text-table-num">{formatCurrency(row.balance)}</span>,
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
            onClick: () => setDeletingAccount({ id: row.id, name: row.name }),
          },
        ]
        return <RowActionsMenu actions={actions} ariaLabel={`Aksi untuk ${row.name}`} />
      },
    },
  ]

  const isError = accountsQuery.isError
  const emptyTitle = isError ? 'Gagal memuat saldo' : 'Belum ada saldo'
  const emptyDescription = isError
    ? accountsQuery.error instanceof ApiError
      ? accountsQuery.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : undefined

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-h1 text-gray-900">Saldo Uang</h1>
        <p className="text-caption text-gray-500">
          Saldo per rekening bank/cash toko. Edit saldo langsung menimpa nilai lama.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={filteredAccounts}
        getRowId={(row) => row.id}
        isLoading={accountsQuery.isPending}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari rekening..."
        filters={
          <Button onClick={() => setCreateOpen(true)} className="ml-auto">
            <Plus />
            Tambah Saldo
          </Button>
        }
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />

      <CreateBalanceAccountDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditBalanceAccountDialog accountId={editingId} onClose={() => setEditingId(null)} />
      <DeleteBalanceAccountDialog
        account={deletingAccount}
        onClose={() => setDeletingAccount(null)}
      />
    </div>
  )
}
