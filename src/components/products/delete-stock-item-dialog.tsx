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

interface DeleteStockItemTarget {
  id: string
  serialNumber: string
  productId: string
}

interface DeleteStockItemDialogProps {
  stockItem: DeleteStockItemTarget | null
  onClose: () => void
}

export function DeleteStockItemDialog({ stockItem, onClose }: DeleteStockItemDialogProps) {
  const queryClient = useQueryClient()
  const open = stockItem !== null

  const deleteMutation = useMutation({
    mutationFn: () => api.delete<{ message: string }>(`/stock-items/${stockItem?.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['products', stockItem?.productId, 'stock-items'],
      })
      showSuccessToast(`Unit ${stockItem?.serialNumber} berhasil diarsipkan.`)
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
      : 'Gagal mengarsipkan unit stok, silakan coba lagi.'
    : null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Arsipkan unit stok?</DialogTitle>
          <DialogDescription>
            {stockItem && (
              <>
                Unit dengan serial number{' '}
                <span className="font-medium text-gray-900">{stockItem.serialNumber}</span> akan
                diarsipkan dan disembunyikan dari daftar. Data tetap tersimpan untuk keperluan
                histori.
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
            {deleteMutation.isPending ? 'Mengarsipkan...' : 'Arsipkan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
