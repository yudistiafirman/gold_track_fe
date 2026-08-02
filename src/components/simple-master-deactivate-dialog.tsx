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

interface SimpleMasterDeactivateTarget {
  id: string
  name: string
}

interface SimpleMasterDeactivateDialogProps {
  endpoint: string
  resourceKey: string
  labelSingular: string
  item: SimpleMasterDeactivateTarget | null
  onClose: () => void
}

/**
 * FE-205: soft delete (is_active=false) — the item stays in the list with a
 * "nonaktif" badge. Note: unlike some other resources, the ticket says this
 * endpoint has no documented "still referenced" 409 guard — if the BE does
 * reject it that way, the error still surfaces here via ApiError.message.
 */
export function SimpleMasterDeactivateDialog({
  endpoint,
  resourceKey,
  labelSingular,
  item,
  onClose,
}: SimpleMasterDeactivateDialogProps) {
  const queryClient = useQueryClient()
  const open = item !== null

  const deactivateMutation = useMutation({
    mutationFn: () => api.delete<{ message: string }>(`${endpoint}/${item?.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resourceKey] })
      showSuccessToast(`${labelSingular} "${item?.name}" berhasil dinonaktifkan.`)
      handleClose()
    },
  })

  function handleClose() {
    deactivateMutation.reset()
    onClose()
  }

  const errorMessage = deactivateMutation.isError
    ? deactivateMutation.error instanceof ApiError
      ? deactivateMutation.error.message
      : `Gagal menonaktifkan ${labelSingular.toLowerCase()}, silakan coba lagi.`
    : null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nonaktifkan {labelSingular.toLowerCase()}?</DialogTitle>
          <DialogDescription>
            {item && (
              <>
                {labelSingular} <span className="font-medium text-gray-900">{item.name}</span>{' '}
                akan ditandai nonaktif dan bisa diaktifkan kembali lewat Edit.
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
            disabled={deactivateMutation.isPending}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => deactivateMutation.mutate()}
            disabled={deactivateMutation.isPending}
          >
            {deactivateMutation.isPending && <Loader2 className="animate-spin" />}
            {deactivateMutation.isPending ? 'Menonaktifkan...' : 'Nonaktifkan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
