import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { CreateExpenseCategoryDialog } from '@/components/expenses/create-expense-category-dialog'
import { DeleteExpenseCategoryDialog } from '@/components/expenses/delete-expense-category-dialog'
import { EditExpenseCategoryDialog } from '@/components/expenses/edit-expense-category-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useExpenseCategories } from '@/hooks/use-expense-categories'

interface ManageExpenseCategoriesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ManageExpenseCategoriesDialog({
  open,
  onOpenChange,
}: ManageExpenseCategoriesDialogProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<{ id: string; name: string } | null>(
    null,
  )

  const categoriesQuery = useExpenseCategories(open)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4 pr-8">
              <DialogTitle>Kelola Kategori Pengeluaran</DialogTitle>
              <Button
                size="sm"
                variant="secondary"
                className="shrink-0"
                onClick={() => setCreateOpen(true)}
              >
                <Plus />
                Tambah
              </Button>
            </div>
          </DialogHeader>

          <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
            {categoriesQuery.isPending ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : categoriesQuery.data?.length === 0 ? (
              <p className="py-8 text-center text-caption text-gray-500">Belum ada kategori.</p>
            ) : (
              categoriesQuery.data?.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between rounded-sm px-3 py-2 hover:bg-muted"
                >
                  <span className="text-body text-gray-900">{category.name}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit ${category.name}`}
                      onClick={() => setEditingId(category.id)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Hapus ${category.name}`}
                      onClick={() => setDeletingCategory({ id: category.id, name: category.name })}
                    >
                      <Trash2 className="text-error" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CreateExpenseCategoryDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditExpenseCategoryDialog categoryId={editingId} onClose={() => setEditingId(null)} />
      <DeleteExpenseCategoryDialog
        category={deletingCategory}
        onClose={() => setDeletingCategory(null)}
      />
    </>
  )
}
