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
import type { DailyClosing } from '@/types/daily-closing'

interface CloseDailyBalanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CloseDailyBalanceDialog({ open, onOpenChange }: CloseDailyBalanceDialogProps) {
  const queryClient = useQueryClient()

  const closeMutation = useMutation({
    mutationFn: () => api.post<DailyClosing>('/daily-closings'),
    onSuccess: (closing) => {
      queryClient.invalidateQueries({ queryKey: ['daily-closings'] })
      queryClient.invalidateQueries({ queryKey: ['reports', 'reconciliation'] })
      showSuccessToast(`Buku tanggal ${closing.closing_date} berhasil ditutup.`)
      handleClose()
    },
  })

  function handleClose() {
    closeMutation.reset()
    onOpenChange(false)
  }

  const errorMessage = closeMutation.isError
    ? closeMutation.error instanceof ApiError
      ? closeMutation.error.message
      : 'Gagal menutup buku, silakan coba lagi.'
    : null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tutup buku hari ini?</DialogTitle>
          <DialogDescription>
            Snapshot saldo uang &amp; nilai emas saat ini akan disimpan permanen sebagai baseline
            rekonsiliasi. Catatan ini tidak bisa diubah atau dihapus setelah dibuat.
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
            disabled={closeMutation.isPending}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={() => closeMutation.mutate()}
            disabled={closeMutation.isPending}
          >
            {closeMutation.isPending && <Loader2 className="animate-spin" />}
            {closeMutation.isPending ? 'Menutup...' : 'Tutup Hari Ini'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
