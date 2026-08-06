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
  type ExternalFundFormErrors,
  type ExternalFundFormValues,
  validateExternalFundForm,
} from '@/lib/external-fund-validation'
import { formatThousands } from '@/lib/format'
import { showErrorToast, showSuccessToast } from '@/lib/toast'
import type { ExternalFund } from '@/types/external-fund'

interface UpdateExternalFundPayload {
  description: string
  amount: number
}

interface EditExternalFundDialogProps {
  fundId: string | null
  onClose: () => void
}

export function EditExternalFundDialog({ fundId, onClose }: EditExternalFundDialogProps) {
  const queryClient = useQueryClient()
  const open = fundId !== null
  const [values, setValues] = useState<ExternalFundFormValues | null>(null)
  const [errors, setErrors] = useState<ExternalFundFormErrors>({})

  const fundQuery = useQuery({
    queryKey: ['external-funds', fundId],
    queryFn: () => api.get<ExternalFund>(`/external-funds/${fundId}`),
    enabled: open,
    retry: false,
  })

  useEffect(() => {
    if (fundQuery.data) {
      setValues({
        description: fundQuery.data.description,
        amount: String(fundQuery.data.amount),
      })
    }
  }, [fundQuery.data])

  useEffect(() => {
    if (!fundQuery.isError) return
    showErrorToast(fundQuery.error, 'Data tidak ditemukan.')
    queryClient.invalidateQueries({ queryKey: ['external-funds'] })
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fundQuery.isError])

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateExternalFundPayload) =>
      api.put<ExternalFund, UpdateExternalFundPayload>(`/external-funds/${fundId}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-funds'] })
      showSuccessToast('Uang diluar berhasil diperbarui.')
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

    const validationErrors = validateExternalFundForm(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    updateMutation.mutate({
      description: values.description.trim(),
      amount: Number(values.amount),
    })
  }

  const submitErrorMessage = updateMutation.isError
    ? updateMutation.error instanceof ApiError
      ? updateMutation.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : null

  const isPrefilling = fundQuery.isPending || values === null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Uang Diluar</DialogTitle>
          <DialogDescription>Perbarui keterangan dan nominal.</DialogDescription>
        </DialogHeader>

        {isPrefilling ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <FormField
              label="Keterangan"
              htmlFor="edit-external-fund-description"
              required
              error={errors.description}
            >
              <Input
                id="edit-external-fund-description"
                value={values.description}
                onChange={(event) =>
                  setValues((prev) => (prev ? { ...prev, description: event.target.value } : prev))
                }
                disabled={updateMutation.isPending}
              />
            </FormField>

            <FormField
              label="Nominal"
              htmlFor="edit-external-fund-amount"
              required
              error={errors.amount}
            >
              <Input
                id="edit-external-fund-amount"
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
