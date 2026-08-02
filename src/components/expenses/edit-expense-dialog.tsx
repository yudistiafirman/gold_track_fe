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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useExpenseCategories } from '@/hooks/use-expense-categories'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import {
  type ExpenseFormErrors,
  type ExpenseFormValues,
  validateExpenseForm,
} from '@/lib/expense-validation'
import { formatThousands } from '@/lib/format'
import { showErrorToast, showSuccessToast } from '@/lib/toast'
import type { Expense } from '@/types/expense'

interface UpdateExpensePayload {
  category_id: string
  amount: number
  description: string
  expense_date: string
}

interface EditExpenseDialogProps {
  expenseId: string | null
  onClose: () => void
}

export function EditExpenseDialog({ expenseId, onClose }: EditExpenseDialogProps) {
  const queryClient = useQueryClient()
  const open = expenseId !== null
  const [values, setValues] = useState<ExpenseFormValues | null>(null)
  const [errors, setErrors] = useState<ExpenseFormErrors>({})

  const categoriesQuery = useExpenseCategories(open)

  const expenseQuery = useQuery({
    queryKey: ['expenses', expenseId],
    queryFn: () => api.get<Expense>(`/expenses/${expenseId}`),
    enabled: open,
    retry: false,
  })

  useEffect(() => {
    if (expenseQuery.data) {
      setValues({
        category_id: expenseQuery.data.category.id,
        amount: String(expenseQuery.data.amount),
        description: expenseQuery.data.description,
        expense_date: expenseQuery.data.expense_date,
      })
    }
  }, [expenseQuery.data])

  useEffect(() => {
    if (!expenseQuery.isError) return
    showErrorToast(expenseQuery.error, 'Pengeluaran tidak ditemukan.')
    queryClient.invalidateQueries({ queryKey: ['expenses'] })
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseQuery.isError])

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateExpensePayload) =>
      api.put<Expense, UpdateExpensePayload>(`/expenses/${expenseId}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      showSuccessToast('Pengeluaran berhasil diperbarui.')
      handleClose()
    },
  })

  function handleClose() {
    setValues(null)
    setErrors({})
    updateMutation.reset()
    onClose()
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!values || updateMutation.isPending) return

    const validationErrors = validateExpenseForm(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    updateMutation.mutate({
      category_id: values.category_id,
      amount: Number(values.amount),
      description: values.description.trim(),
      expense_date: values.expense_date,
    })
  }

  const submitErrorMessage = updateMutation.isError
    ? updateMutation.error instanceof ApiError
      ? updateMutation.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : null

  const isPrefilling = expenseQuery.isPending || values === null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Pengeluaran</DialogTitle>
          <DialogDescription>Perbarui detail pengeluaran.</DialogDescription>
        </DialogHeader>

        {isPrefilling ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <FormField
              label="Kategori"
              htmlFor="edit-expense-category"
              required
              error={errors.category_id}
            >
              <Select
                value={values.category_id}
                onValueChange={(value) =>
                  setValues((prev) => (prev ? { ...prev, category_id: value } : prev))
                }
                disabled={updateMutation.isPending || categoriesQuery.isPending}
              >
                <SelectTrigger id="edit-expense-category" className="w-full">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesQuery.data?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Jumlah" htmlFor="edit-expense-amount" required error={errors.amount}>
              <Input
                id="edit-expense-amount"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={formatThousands(values.amount)}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, '')
                  setValues((prev) => (prev ? { ...prev, amount: digits } : prev))
                }}
                disabled={updateMutation.isPending}
              />
            </FormField>

            <FormField
              label="Deskripsi"
              htmlFor="edit-expense-description"
              required
              error={errors.description}
            >
              <Input
                id="edit-expense-description"
                value={values.description}
                onChange={(event) =>
                  setValues((prev) => (prev ? { ...prev, description: event.target.value } : prev))
                }
                disabled={updateMutation.isPending}
              />
            </FormField>

            <FormField
              label="Tanggal"
              htmlFor="edit-expense-date"
              required
              error={errors.expense_date}
            >
              <Input
                id="edit-expense-date"
                type="date"
                value={values.expense_date}
                onChange={(event) =>
                  setValues((prev) => (prev ? { ...prev, expense_date: event.target.value } : prev))
                }
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
