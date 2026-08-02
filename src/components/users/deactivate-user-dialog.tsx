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

interface DeactivateUserTarget {
  id: string
  name: string
}

interface DeactivateUserDialogProps {
  user: DeactivateUserTarget | null
  onClose: () => void
}

/** FE-1401: DELETE is a soft delete (is_active=false) — the row stays in the list with a "nonaktif" badge, not removed. */
export function DeactivateUserDialog({ user, onClose }: DeactivateUserDialogProps) {
  const queryClient = useQueryClient()
  const open = user !== null

  const deactivateMutation = useMutation({
    mutationFn: () => api.delete<{ message: string }>(`/users/${user?.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      showSuccessToast(`User "${user?.name}" berhasil dinonaktifkan.`)
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
      : 'Gagal menonaktifkan user, silakan coba lagi.'
    : null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nonaktifkan user?</DialogTitle>
          <DialogDescription>
            {user && (
              <>
                User <span className="font-medium text-gray-900">{user.name}</span> tidak akan
                bisa login sampai diaktifkan kembali lewat menu Edit.
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
