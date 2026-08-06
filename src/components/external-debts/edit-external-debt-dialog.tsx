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
import {
  type ExternalDebtFormErrors,
  type ExternalDebtFormValues,
  validateExternalDebtForm,
} from '@/lib/external-debt-validation'
import { formatThousands } from '@/lib/format'
import { showErrorToast, showSuccessToast } from '@/lib/toast'
import type { ExternalDebt } from '@/types/external-debt'

interface UpdateExternalDebtPayload {
  debtor_name: string
  amount: number
}

interface EditExternalDebtDialogProps {
  debtId: string | null
  onClose: () => void
}

export function EditExternalDebtDialog({ debtId, onClose }: EditExternalDebtDialogProps) {
  const queryClient = useQueryClient()
  const open = debtId !== null
  const [values, setValues] = useState<ExternalDebtFormValues | null>(null)
  const [errors, setErrors] = useState<ExternalDebtFormErrors>({})

  const debtQuery = useQuery({
    queryKey: ['external-debts', debtId],
    queryFn: () => api.get<ExternalDebt>(`/external-debts/${debtId}`),
    enabled: open,
    retry: false,
  })

  useEffect(() => {
    if (debtQuery.data) {
      setValues({
        debtor_name: debtQuery.data.debtor_name,
        amount: String(debtQuery.data.amount),
      })
    }
  }, [debtQuery.data])

  useEffect(() => {
    if (!debtQuery.isError) return
    showErrorToast(debtQuery.error, 'Data tidak ditemukan.')
    queryClient.invalidateQueries({ queryKey: ['external-debts'] })
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debtQuery.isError])

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateExternalDebtPayload) =>
      api.put<ExternalDebt, UpdateExternalDebtPayload>(`/external-debts/${debtId}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-debts'] })
      queryClient.invalidateQueries({ queryKey: ['reports', 'dashboard'] })
      showSuccessToast('Hutang diluar berhasil diperbarui.')
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

    const validationErrors = validateExternalDebtForm(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    updateMutation.mutate({
      debtor_name: values.debtor_name.trim(),
      amount: Number(values.amount),
    })
  }

  const submitErrorMessage = updateMutation.isError
    ? updateMutation.error instanceof ApiError
      ? updateMutation.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : null

  const isPrefilling = debtQuery.isPending || values === null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Hutang Diluar</DialogTitle>
          <DialogDescription>
            Perbarui nominal untuk mencatat cicilan, atau nama peminjam.
          </DialogDescription>
        </DialogHeader>

        {isPrefilling ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <FormField
              label="Nama Peminjam"
              htmlFor="edit-external-debt-debtor-name"
              required
              error={errors.debtor_name}
            >
              <Input
                id="edit-external-debt-debtor-name"
                value={values.debtor_name}
                onChange={(event) =>
                  setValues((prev) => (prev ? { ...prev, debtor_name: event.target.value } : prev))
                }
                disabled={updateMutation.isPending}
              />
            </FormField>

            <FormField
              label="Nominal"
              htmlFor="edit-external-debt-amount"
              required
              error={errors.amount}
            >
              <Input
                id="edit-external-debt-amount"
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
