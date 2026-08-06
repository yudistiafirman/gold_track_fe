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
import {
  type ExternalDebtFormValues,
  validateExternalDebtForm,
} from '@/lib/external-debt-validation'
import { formatThousands } from '@/lib/format'
import { showSuccessToast } from '@/lib/toast'
import type { ExternalDebt } from '@/types/external-debt'

interface CreateExternalDebtPayload {
  debtor_name: string
  amount: number
}

function createInitialValues(): ExternalDebtFormValues {
  return { debtor_name: '', amount: '' }
}

interface CreateExternalDebtDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateExternalDebtDialog({ open, onOpenChange }: CreateExternalDebtDialogProps) {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<ExternalDebtFormValues>(createInitialValues)
  const [errors, setErrors] = useState<ReturnType<typeof validateExternalDebtForm>>({})

  const createMutation = useMutation({
    mutationFn: (payload: CreateExternalDebtPayload) =>
      api.post<ExternalDebt, CreateExternalDebtPayload>('/external-debts', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-debts'] })
      queryClient.invalidateQueries({ queryKey: ['reports', 'dashboard'] })
      showSuccessToast('Hutang diluar berhasil ditambahkan.')
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

    const validationErrors = validateExternalDebtForm(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    createMutation.mutate({
      debtor_name: values.debtor_name.trim(),
      amount: Number(values.amount),
    })
  }

  const submitErrorMessage = createMutation.isError
    ? createMutation.error instanceof ApiError
      ? createMutation.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : null

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(next) : handleClose())}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Tambah Hutang Diluar</DialogTitle>
          <DialogDescription>Catat piutang orang yang pinjam uang dari toko.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <FormField
            label="Nama Peminjam"
            htmlFor="external-debt-debtor-name"
            required
            error={errors.debtor_name}
          >
            <Input
              id="external-debt-debtor-name"
              autoFocus
              placeholder="Budi"
              value={values.debtor_name}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, debtor_name: event.target.value }))
              }
              disabled={createMutation.isPending}
            />
          </FormField>

          <FormField label="Nominal" htmlFor="external-debt-amount" required error={errors.amount}>
            <Input
              id="external-debt-amount"
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
              {createMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
