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
import { type ExpenseFormValues, validateExpenseForm } from '@/lib/expense-validation'
import { formatThousands, todayDateInputValue } from '@/lib/format'
import { showSuccessToast } from '@/lib/toast'
import type { Expense } from '@/types/expense'

interface CreateExpensePayload {
  category_id: string
  amount: number
  description: string
  expense_date: string
}

function createInitialValues(): ExpenseFormValues {
  return { category_id: '', amount: '', description: '', expense_date: todayDateInputValue() }
}

interface CreateExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateExpenseDialog({ open, onOpenChange }: CreateExpenseDialogProps) {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<ExpenseFormValues>(createInitialValues)
  const [errors, setErrors] = useState<ReturnType<typeof validateExpenseForm>>({})

  const categoriesQuery = useExpenseCategories(open)

  const createMutation = useMutation({
    mutationFn: (payload: CreateExpensePayload) =>
      api.post<Expense, CreateExpensePayload>('/expenses', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      showSuccessToast('Pengeluaran berhasil dicatat.')
      handleClose()
    },
  })

  function handleClose() {
    setValues(createInitialValues())
    setErrors({})
    createMutation.reset()
    onOpenChange(false)
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (createMutation.isPending) return

    const validationErrors = validateExpenseForm(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    createMutation.mutate({
      category_id: values.category_id,
      amount: Number(values.amount),
      description: values.description.trim(),
      expense_date: values.expense_date,
    })
  }

  const submitErrorMessage = createMutation.isError
    ? createMutation.error instanceof ApiError
      ? createMutation.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : null

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(next) : handleClose())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Pengeluaran</DialogTitle>
          <DialogDescription>Catat pengeluaran operasional toko.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <FormField
            label="Kategori"
            htmlFor="expense-category"
            required
            error={errors.category_id}
          >
            <Select
              value={values.category_id}
              onValueChange={(value) => setValues((prev) => ({ ...prev, category_id: value }))}
              disabled={createMutation.isPending || categoriesQuery.isPending}
            >
              <SelectTrigger id="expense-category" className="w-full">
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

          <FormField label="Jumlah" htmlFor="expense-amount" required error={errors.amount}>
            <Input
              id="expense-amount"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={formatThousands(values.amount)}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, '')
                setValues((prev) => ({ ...prev, amount: digits }))
              }}
              disabled={createMutation.isPending}
            />
          </FormField>

          <FormField
            label="Deskripsi"
            htmlFor="expense-description"
            required
            error={errors.description}
          >
            <Input
              id="expense-description"
              value={values.description}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, description: event.target.value }))
              }
              disabled={createMutation.isPending}
            />
          </FormField>

          <FormField
            label="Tanggal"
            htmlFor="expense-date"
            required
            error={errors.expense_date}
          >
            <Input
              id="expense-date"
              type="date"
              value={values.expense_date}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, expense_date: event.target.value }))
              }
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
              {createMutation.isPending ? 'Menyimpan...' : 'Simpan Pengeluaran'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
