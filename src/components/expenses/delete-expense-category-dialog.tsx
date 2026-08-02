import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import { showSuccessToast } from '@/lib/toast'

interface DeleteExpenseCategoryTarget {
  id: string
  name: string
}

interface DeleteExpenseCategoryDialogProps {
  category: DeleteExpenseCategoryTarget | null
  onClose: () => void
}

export function DeleteExpenseCategoryDialog({
  category,
  onClose,
}: DeleteExpenseCategoryDialogProps) {
  const queryClient = useQueryClient()
  const open = category !== null

  const deleteMutation = useMutation({
    mutationFn: () => api.delete<{ message: string }>(`/expense-categories/${category?.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] })
      showSuccessToast(`Kategori "${category?.name}" berhasil dihapus.`)
      handleClose()
    },
  })

  function handleClose() {
    deleteMutation.reset()
    onClose()
  }

  // FE-1201: BE returns 409 when the category is still referenced by an
  // expense — surfaced directly rather than pre-checking client-side.
  const errorMessage = deleteMutation.isError
    ? deleteMutation.error instanceof ApiError
      ? deleteMutation.error.message
      : 'Gagal menghapus kategori, silakan coba lagi.'
    : null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus kategori?</DialogTitle>
          <DialogDescription>
            {category && (
              <>
                Kategori <span className="font-medium text-gray-900">{category.name}</span> akan
                dihapus permanen.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <p
            role="alert"
            className="rounded-sm border border-error/30 bg-error/10 px-3 py-2 text-caption text-error"
          >
            {errorMessage}
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={deleteMutation.isPending}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending && <Loader2 className="animate-spin" />}
            {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
