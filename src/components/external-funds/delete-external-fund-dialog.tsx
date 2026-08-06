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

interface DeleteExternalFundTarget {
  id: string
  description: string
}

interface DeleteExternalFundDialogProps {
  fund: DeleteExternalFundTarget | null
  onClose: () => void
}

export function DeleteExternalFundDialog({ fund, onClose }: DeleteExternalFundDialogProps) {
  const queryClient = useQueryClient()
  const open = fund !== null

  const deleteMutation = useMutation({
    mutationFn: () => api.delete<{ message: string }>(`/external-funds/${fund?.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-funds'] })
      showSuccessToast('Uang diluar berhasil dihapus.')
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
      : 'Gagal menghapus data, silakan coba lagi.'
    : null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus data?</DialogTitle>
          <DialogDescription>
            {fund && (
              <>
                <span className="font-medium text-gray-900">{fund.description}</span> akan
                dihapus permanen dan tidak bisa dibatalkan.
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
