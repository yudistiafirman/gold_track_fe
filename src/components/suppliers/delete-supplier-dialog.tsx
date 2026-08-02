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

interface DeleteSupplierTarget {
  id: string
  name: string
}

interface DeleteSupplierDialogProps {
  supplier: DeleteSupplierTarget | null
  onClose: () => void
}

export function DeleteSupplierDialog({ supplier, onClose }: DeleteSupplierDialogProps) {
  const queryClient = useQueryClient()
  const open = supplier !== null

  const deleteSupplierMutation = useMutation({
    mutationFn: () => api.delete<{ message: string }>(`/suppliers/${supplier?.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      showSuccessToast(`Supplier "${supplier?.name}" berhasil dihapus.`)
      handleClose()
    },
  })

  function handleClose() {
    deleteSupplierMutation.reset()
    onClose()
  }

  const errorMessage = deleteSupplierMutation.isError
    ? deleteSupplierMutation.error instanceof ApiError
      ? deleteSupplierMutation.error.message
      : 'Gagal menghapus supplier, silakan coba lagi.'
    : null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus supplier?</DialogTitle>
          <DialogDescription>
            {supplier && (
              <>
                Supplier <span className="font-medium text-gray-900">{supplier.name}</span> akan
                dihapus dan tidak muncul lagi di daftar aktif.
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
            disabled={deleteSupplierMutation.isPending}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => deleteSupplierMutation.mutate()}
            disabled={deleteSupplierMutation.isPending}
          >
            {deleteSupplierMutation.isPending && <Loader2 className="animate-spin" />}
            {deleteSupplierMutation.isPending ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
