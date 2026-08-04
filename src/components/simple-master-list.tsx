import { useQuery } from '@tanstack/react-query'
import { Ban, Pencil, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DataTable } from '@/components/data-table/data-table'
import type { DataTableColumn } from '@/components/data-table/types'
import { type RowAction, RowActionsMenu } from '@/components/row-actions-menu'
import { SimpleMasterDeactivateDialog } from '@/components/simple-master-deactivate-dialog'
import { SimpleMasterFormDialog } from '@/components/simple-master-form-dialog'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import type { LookupItem } from '@/types/lookup'

interface SimpleMasterListProps {
  /** Query key segment, e.g. 'categories' | 'brands'. */
  resourceKey: string
  /** e.g. '/categories' | '/brands'. */
  endpoint: string
  /** e.g. 'Kategori' | 'Brand'. */
  labelSingular: string
}

/**
 * FE-205: Kategori and Brand are identical-shape resources (name +
 * is_active), so this one component drives both tabs — no twin pages.
 * Response is a plain array, not paginated, so search/filter is client-side.
 */
export function SimpleMasterList({ resourceKey, endpoint, labelSingular }: SimpleMasterListProps) {
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deactivating, setDeactivating] = useState<{ id: string; name: string } | null>(null)

  const listQuery = useQuery({
    queryKey: [resourceKey],
    queryFn: () => api.get<LookupItem[]>(endpoint),
  })

  const filteredItems = useMemo(() => {
    const items = listQuery.data ?? []
    const lowerSearch = search.trim().toLowerCase()
    if (!lowerSearch) return items
    return items.filter((item) => item.name.toLowerCase().includes(lowerSearch))
  }, [listQuery.data, search])

  const columns: DataTableColumn<LookupItem>[] = [
    { id: 'name', header: 'Nama', cell: (row) => row.name },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => (
        <StatusBadge
          tone={row.is_active ? 'success' : 'gray'}
          label={row.is_active ? 'Aktif' : 'Nonaktif'}
        />
      ),
    },
    {
      id: 'actions',
      header: '',
      className: 'w-0',
      cell: (row) => {
        const actions: RowAction[] = [
          { label: 'Edit', icon: Pencil, onClick: () => setEditingId(row.id) },
          ...(row.is_active
            ? [
                {
                  label: 'Nonaktifkan',
                  icon: Ban,
                  variant: 'destructive' as const,
                  onClick: () => setDeactivating({ id: row.id, name: row.name }),
                },
              ]
            : []),
        ]
        return <RowActionsMenu actions={actions} ariaLabel={`Aksi untuk ${row.name}`} />
      },
    },
  ]

  const isError = listQuery.isError
  const lowerLabel = labelSingular.toLowerCase()
  const emptyTitle = isError ? `Gagal memuat ${lowerLabel}` : `Belum ada ${lowerLabel}`
  const emptyDescription = isError
    ? listQuery.error instanceof ApiError
      ? listQuery.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : undefined

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          Tambah {labelSingular}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filteredItems}
        getRowId={(row) => row.id}
        isLoading={listQuery.isPending}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={`Cari ${lowerLabel}...`}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />

      <SimpleMasterFormDialog
        mode="create"
        endpoint={endpoint}
        resourceKey={resourceKey}
        labelSingular={labelSingular}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <SimpleMasterFormDialog
        mode="edit"
        endpoint={endpoint}
        resourceKey={resourceKey}
        labelSingular={labelSingular}
        itemId={editingId}
        open={editingId !== null}
        onOpenChange={(open) => !open && setEditingId(null)}
      />
      <SimpleMasterDeactivateDialog
        endpoint={endpoint}
        resourceKey={resourceKey}
        labelSingular={labelSingular}
        item={deactivating}
        onClose={() => setDeactivating(null)}
      />
    </div>
  )
}
