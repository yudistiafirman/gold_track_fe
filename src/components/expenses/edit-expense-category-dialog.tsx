import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { type SubmitEvent, useEffect, useState } from 'react'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import { showErrorToast, showSuccessToast } from '@/lib/toast'
import type { ExpenseCategory } from '@/types/expense-category'

interface UpdateExpenseCategoryPayload {
  name: string
}

interface EditExpenseCategoryDialogProps {
  categoryId: string | null
  onClose: () => void
}

export function EditExpenseCategoryDialog({
  categoryId,
  onClose,
}: EditExpenseCategoryDialogProps) {
  const queryClient = useQueryClient()
  const open = categoryId !== null
  const [name, setName] = useState<string | null>(null)
  const [error, setError] = useState<string | undefined>()

  const categoryQuery = useQuery({
    queryKey: ['expense-categories', categoryId],
    queryFn: () => api.get<ExpenseCategory>(`/expense-categories/${categoryId}`),
    enabled: open,
    retry: false,
  })

  useEffect(() => {
    if (categoryQuery.data) {
      setName(categoryQuery.data.name)
    }
  }, [categoryQuery.data])

  useEffect(() => {
    if (!categoryQuery.isError) return
    showErrorToast(categoryQuery.error, 'Kategori tidak ditemukan.')
    queryClient.invalidateQueries({ queryKey: ['expense-categories'] })
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryQuery.isError])

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateExpenseCategoryPayload) =>
      api.put<ExpenseCategory, UpdateExpenseCategoryPayload>(
        `/expense-categories/${categoryId}`,
        payload,
      ),
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] })
      showSuccessToast(`Kategori "${category.name}" berhasil diperbarui.`)
      handleClose()
    },
  })

  function handleClose() {
    setName(null)
    setError(undefined)
    updateMutation.reset()
    onClose()
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (name === null || updateMutation.isPending) return

    if (!name.trim()) {
      setError('Nama kategori wajib diisi')
      return
    }
    setError(undefined)

    updateMutation.mutate({ name: name.trim() })
  }

  const submitErrorMessage = updateMutation.isError
    ? updateMutation.error instanceof ApiError
      ? updateMutation.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : null

  const isPrefilling = categoryQuery.isPending || name === null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Kategori</DialogTitle>
          <DialogDescription>Perbarui nama kategori pengeluaran.</DialogDescription>
        </DialogHeader>

        {isPrefilling ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <FormField
              label="Nama Kategori"
              htmlFor="edit-expense-category-name"
              required
              error={error}
            >
              <Input
                id="edit-expense-category-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={updateMutation.isPending}
              />
            </FormField>

            {submitErrorMessage && (
              <p
                role="alert"
                className="rounded-sm border border-error/30 bg-error/10 px-3 py-2 text-caption text-error"
              >
                {submitErrorMessage}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={updateMutation.isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="animate-spin" />}
                {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
