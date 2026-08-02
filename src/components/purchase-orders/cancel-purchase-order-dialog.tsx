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

interface CancelPurchaseOrderTarget {
  id: string
  poCode: string
}

interface CancelPurchaseOrderDialogProps {
  purchaseOrder: CancelPurchaseOrderTarget | null
  onClose: () => void
}

export function CancelPurchaseOrderDialog({
  purchaseOrder,
  onClose,
}: CancelPurchaseOrderDialogProps) {
  const queryClient = useQueryClient()
  const open = purchaseOrder !== null

  const cancelMutation = useMutation({
    mutationFn: () => api.post<{ message: string }>(`/purchase-orders/${purchaseOrder?.id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      showSuccessToast(`PO ${purchaseOrder?.poCode} berhasil dibatalkan.`)
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
      : 'Gagal membatalkan PO, silakan coba lagi.'
    : null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Batalkan PO?</DialogTitle>
          <DialogDescription>
            {purchaseOrder && (
              <>
                PO <span className="font-medium text-gray-900">{purchaseOrder.poCode}</span> akan
                dibatalkan dan tidak bisa diterima lagi.
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
            {cancelMutation.isPending ? 'Membatalkan...' : 'Batalkan PO'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
