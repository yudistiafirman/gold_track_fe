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

interface CancelTransactionTarget {
  id: string
  transactionCode: string
}

interface CancelTransactionDialogProps {
  transaction: CancelTransactionTarget | null
  onClose: () => void
}

export function CancelTransactionDialog({
  transaction,
  onClose,
}: CancelTransactionDialogProps) {
  const queryClient = useQueryClient()
  const open = transaction !== null

  const cancelMutation = useMutation({
    mutationFn: () => api.post(`/transactions/${transaction?.id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', transaction?.id, 'receipt'] })
      showSuccessToast(`Transaksi ${transaction?.transactionCode} berhasil dibatalkan.`)
      handleClose()
    },
  })

  function handleClose() {
    cancelMutation.reset()
    onClose()
  }

  const errorMessage = cancelMutation.isError
    ? cancelMutation.error instanceof ApiError
      ? cancelMutation.error.message
      : 'Gagal membatalkan transaksi, silakan coba lagi.'
    : null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Batalkan Transaksi?</DialogTitle>
          <DialogDescription>
            {transaction && (
              <>
                Transaksi{' '}
                <span className="font-medium text-gray-900">{transaction.transactionCode}</span>{' '}
                akan dibatalkan dan efeknya ke stok akan otomatis disesuaikan.
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
            disabled={cancelMutation.isPending}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending && <Loader2 className="animate-spin" />}
            {cancelMutation.isPending ? 'Membatalkan...' : 'Batalkan Transaksi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
