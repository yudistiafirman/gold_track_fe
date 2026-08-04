import { useQuery } from '@tanstack/react-query'
import { Pencil, Plus, UserX } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DataTable } from '@/components/data-table/data-table'
import type { DataTableColumn } from '@/components/data-table/types'
import { type RowAction, RowActionsMenu } from '@/components/row-actions-menu'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { CreateUserDialog } from '@/components/users/create-user-dialog'
import { DeactivateUserDialog } from '@/components/users/deactivate-user-dialog'
import { EditUserDialog } from '@/components/users/edit-user-dialog'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import { ACCOUNT_STATUS_TONE, ROLE_TONE } from '@/lib/domain-status'
import { formatDate } from '@/lib/format'
import { useAuthStore } from '@/store/auth-store'
import type { User } from '@/types/user'

export function UsersPage() {
  const currentUserId = useAuthStore((state) => state.user?.id)
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [deactivatingUser, setDeactivatingUser] = useState<{ id: string; name: string } | null>(
    null,
  )

  // FE-1401: plain array, not paginated — search/filter happens client-side.
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<User[]>('/users'),
  })

  const filteredUsers = useMemo(() => {
    const users = usersQuery.data ?? []
    const lowerSearch = search.trim().toLowerCase()
    if (!lowerSearch) return users
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(lowerSearch) ||
        user.email.toLowerCase().includes(lowerSearch),
    )
  }, [usersQuery.data, search])

  const columns: DataTableColumn<User>[] = [
    { id: 'name', header: 'Nama', cell: (row) => row.name },
    { id: 'email', header: 'Email', cell: (row) => row.email },
    {
      id: 'role',
      header: 'Role',
      cell: (row) => <StatusBadge tone={ROLE_TONE[row.role]} label={row.role} />,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => (
        <StatusBadge
          tone={row.is_active ? ACCOUNT_STATUS_TONE.AKTIF : ACCOUNT_STATUS_TONE.NONAKTIF}
          label={row.is_active ? 'Aktif' : 'Nonaktif'}
        />
      ),
    },
    {
      id: 'last_login_at',
      header: 'Login Terakhir',
      cell: (row) => (row.last_login_at ? formatDate(row.last_login_at) : 'Belum pernah'),
    },
    {
      id: 'actions',
      header: '',
      className: 'w-0',
      cell: (row) => {
        const actions: RowAction[] = [
          { label: 'Edit', icon: Pencil, onClick: () => setEditingUserId(row.id) },
          ...(row.is_active && row.id !== currentUserId
            ? [
                {
                  label: 'Nonaktifkan',
                  icon: UserX,
                  variant: 'destructive' as const,
                  onClick: () => setDeactivatingUser({ id: row.id, name: row.name }),
                },
              ]
            : []),
        ]
        return <RowActionsMenu actions={actions} ariaLabel={`Aksi untuk ${row.name}`} />
      },
    },
  ]

  const isError = usersQuery.isError
  const emptyTitle = isError ? 'Gagal memuat user' : 'Belum ada user'
  const emptyDescription = isError
    ? usersQuery.error instanceof ApiError
      ? usersQuery.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : undefined

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-h1 text-gray-900">Manajemen User</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          Tambah User
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={filteredUsers}
        getRowId={(row) => row.id}
        isLoading={usersQuery.isPending}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari nama/email..."
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />
      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditUserDialog userId={editingUserId} onClose={() => setEditingUserId(null)} />
      <DeactivateUserDialog
        user={deactivatingUser}
        onClose={() => setDeactivatingUser(null)}
      />
    </div>
  )
}
