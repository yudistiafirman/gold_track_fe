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

interface ArchiveProductTarget {
  id: string
  name: string
}

interface ArchiveProductDialogProps {
  product: ArchiveProductTarget | null
  onClose: () => void
}

export function ArchiveProductDialog({ product, onClose }: ArchiveProductDialogProps) {
  const queryClient = useQueryClient()
  const open = product !== null

  const archiveMutation = useMutation({
    mutationFn: () => api.delete<{ message: string }>(`/products/${product?.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      showSuccessToast(`Produk "${product?.name}" berhasil diarsipkan.`)
      handleClose()
    },
  })

  function handleClose() {
    archiveMutation.reset()
    onClose()
  }

  const errorMessage = archiveMutation.isError
    ? archiveMutation.error instanceof ApiError
      ? archiveMutation.error.message
      : 'Gagal mengarsipkan produk, silakan coba lagi.'
    : null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Arsipkan produk?</DialogTitle>
          <DialogDescription>
            {product && (
              <>
                Produk <span className="font-medium text-gray-900">{product.name}</span> akan
                diarsipkan dan hilang dari daftar produk aktif.
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
            disabled={archiveMutation.isPending}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => archiveMutation.mutate()}
            disabled={archiveMutation.isPending}
          >
            {archiveMutation.isPending && <Loader2 className="animate-spin" />}
            {archiveMutation.isPending ? 'Mengarsipkan...' : 'Arsipkan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
