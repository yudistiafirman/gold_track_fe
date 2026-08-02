import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { type SubmitEvent, useState } from 'react'
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
import { showSuccessToast } from '@/lib/toast'
import type { ExpenseCategory } from '@/types/expense-category'

interface CreateExpenseCategoryPayload {
  name: string
}

interface CreateExpenseCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateExpenseCategoryDialog({
  open,
  onOpenChange,
}: CreateExpenseCategoryDialogProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | undefined>()

  const createMutation = useMutation({
    mutationFn: (payload: CreateExpenseCategoryPayload) =>
      api.post<ExpenseCategory, CreateExpenseCategoryPayload>('/expense-categories', payload),
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] })
      showSuccessToast(`Kategori "${category.name}" berhasil ditambahkan.`)
      handleClose()
    },
  })

  function handleClose() {
    setName('')
    setError(undefined)
    createMutation.reset()
    onOpenChange(false)
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (createMutation.isPending) return

    if (!name.trim()) {
      setError('Nama kategori wajib diisi')
      return
    }
    setError(undefined)

    createMutation.mutate({ name: name.trim() })
  }

  // FE-1201 AC2: 409 duplicate name surfaced verbatim from the BE — no
  // separate client-side duplicate check since the category list may be
  // stale relative to what the server actually has.
  const submitErrorMessage = createMutation.isError
    ? createMutation.error instanceof ApiError
      ? createMutation.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : null

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(next) : handleClose())}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Tambah Kategori</DialogTitle>
          <DialogDescription>Kategori baru untuk mengelompokkan pengeluaran.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <FormField label="Nama Kategori" htmlFor="expense-category-name" required error={error}>
            <Input
              id="expense-category-name"
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={createMutation.isPending}
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
              disabled={createMutation.isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="animate-spin" />}
              {createMutation.isPending ? 'Menyimpan...' : 'Simpan Kategori'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
