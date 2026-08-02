import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DataTable } from '@/components/data-table/data-table'
import type { DataTableColumn } from '@/components/data-table/types'
import { CreateExpenseCategoryDialog } from '@/components/expenses/create-expense-category-dialog'
import { DeleteExpenseCategoryDialog } from '@/components/expenses/delete-expense-category-dialog'
import { EditExpenseCategoryDialog } from '@/components/expenses/edit-expense-category-dialog'
import { Button } from '@/components/ui/button'
import { useExpenseCategories } from '@/hooks/use-expense-categories'
import { ApiError } from '@/lib/api/error'
import type { ExpenseCategory } from '@/types/expense-category'

export function ExpenseCategoriesPage() {
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<{ id: string; name: string } | null>(
    null,
  )

  const categoriesQuery = useExpenseCategories()

  const filteredCategories = useMemo(() => {
    const items = categoriesQuery.data ?? []
    const lowerSearch = search.trim().toLowerCase()
    if (!lowerSearch) return items
    return items.filter((item) => item.name.toLowerCase().includes(lowerSearch))
  }, [categoriesQuery.data, search])

  const columns: DataTableColumn<ExpenseCategory>[] = [
    { id: 'name', header: 'Nama', cell: (row) => row.name },
    {
      id: 'actions',
      header: '',
      className: 'w-0',
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${row.name}`}
            onClick={() => setEditingId(row.id)}
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Hapus ${row.name}`}
            onClick={() => setDeletingCategory({ id: row.id, name: row.name })}
          >
            <Trash2 className="text-error" />
          </Button>
        </div>
      ),
    },
  ]

  const isError = categoriesQuery.isError
  const emptyTitle = isError ? 'Gagal memuat kategori' : 'Belum ada kategori'
  const emptyDescription = isError
    ? categoriesQuery.error instanceof ApiError
      ? categoriesQuery.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : undefined

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          Tambah Kategori
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filteredCategories}
        getRowId={(row) => row.id}
        isLoading={categoriesQuery.isPending}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari kategori..."
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />

      <CreateExpenseCategoryDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditExpenseCategoryDialog categoryId={editingId} onClose={() => setEditingId(null)} />
      <DeleteExpenseCategoryDialog
        category={deletingCategory}
        onClose={() => setDeletingCategory(null)}
      />
    </div>
  )
}
