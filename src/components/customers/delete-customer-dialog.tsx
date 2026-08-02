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

interface DeleteCustomerTarget {
  id: string
  name: string
}

interface DeleteCustomerDialogProps {
  customer: DeleteCustomerTarget | null
  onClose: () => void
}

export function DeleteCustomerDialog({ customer, onClose }: DeleteCustomerDialogProps) {
  const queryClient = useQueryClient()
  const open = customer !== null

  const deleteCustomerMutation = useMutation({
    mutationFn: () => api.delete<{ message: string }>(`/customers/${customer?.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      showSuccessToast(`Pelanggan "${customer?.name}" berhasil dihapus.`)
      handleClose()
    },
  })

  function handleClose() {
    deleteCustomerMutation.reset()
    onClose()
  }

  const errorMessage = deleteCustomerMutation.isError
    ? deleteCustomerMutation.error instanceof ApiError
      ? deleteCustomerMutation.error.message
      : 'Gagal menghapus pelanggan, silakan coba lagi.'
    : null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus pelanggan?</DialogTitle>
          <DialogDescription>
            {customer && (
              <>
                Pelanggan <span className="font-medium text-gray-900">{customer.name}</span>{' '}
                akan dihapus dan tidak muncul lagi di daftar aktif.
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
            disabled={deleteCustomerMutation.isPending}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => deleteCustomerMutation.mutate()}
            disabled={deleteCustomerMutation.isPending}
          >
            {deleteCustomerMutation.isPending && <Loader2 className="animate-spin" />}
            {deleteCustomerMutation.isPending ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
