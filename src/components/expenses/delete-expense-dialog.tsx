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
import { formatCurrency } from '@/lib/format'
import { showSuccessToast } from '@/lib/toast'

interface DeleteExpenseTarget {
  id: string
  description: string
  amount: number
}

interface DeleteExpenseDialogProps {
  expense: DeleteExpenseTarget | null
  onClose: () => void
}

export function DeleteExpenseDialog({ expense, onClose }: DeleteExpenseDialogProps) {
  const queryClient = useQueryClient()
  const open = expense !== null

  const deleteMutation = useMutation({
    mutationFn: () => api.delete<{ message: string }>(`/expenses/${expense?.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      showSuccessToast('Pengeluaran berhasil dihapus.')
      handleClose()
    },
  })

  function handleClose() {
    deleteMutation.reset()
    onClose()
  }

  const errorMessage = deleteMutation.isError
    ? deleteMutation.error instanceof ApiError
      ? deleteMutation.error.message
      : 'Gagal menghapus pengeluaran, silakan coba lagi.'
    : null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus pengeluaran?</DialogTitle>
          <DialogDescription>
            {expense && (
              <>
                Pengeluaran <span className="font-medium text-gray-900">{expense.description}</span>{' '}
                ({formatCurrency(expense.amount)}) akan dihapus permanen.
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
