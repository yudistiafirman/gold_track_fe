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
  type BalanceAccountFormErrors,
  type BalanceAccountFormValues,
  validateBalanceAccountForm,
} from '@/lib/balance-account-validation'
import { formatThousands } from '@/lib/format'
import { showErrorToast, showSuccessToast } from '@/lib/toast'
import type { BalanceAccount } from '@/types/balance-account'

interface UpdateBalanceAccountPayload {
  name: string
  balance: number
}

interface EditBalanceAccountDialogProps {
  accountId: string | null
  onClose: () => void
}

export function EditBalanceAccountDialog({ accountId, onClose }: EditBalanceAccountDialogProps) {
  const queryClient = useQueryClient()
  const open = accountId !== null
  const [values, setValues] = useState<BalanceAccountFormValues | null>(null)
  const [errors, setErrors] = useState<BalanceAccountFormErrors>({})

  const accountQuery = useQuery({
    queryKey: ['balance-accounts', accountId],
    queryFn: () => api.get<BalanceAccount>(`/balance-accounts/${accountId}`),
    enabled: open,
    retry: false,
  })

  useEffect(() => {
    if (accountQuery.data) {
      setValues({ name: accountQuery.data.name, balance: String(accountQuery.data.balance) })
    }
  }, [accountQuery.data])

  useEffect(() => {
    if (!accountQuery.isError) return
    showErrorToast(accountQuery.error, 'Saldo tidak ditemukan.')
    queryClient.invalidateQueries({ queryKey: ['balance-accounts'] })
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountQuery.isError])

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateBalanceAccountPayload) =>
      api.put<BalanceAccount, UpdateBalanceAccountPayload>(
        `/balance-accounts/${accountId}`,
        payload,
      ),
    onSuccess: (account) => {
      queryClient.invalidateQueries({ queryKey: ['balance-accounts'] })
      showSuccessToast(`Saldo "${account.name}" berhasil diperbarui.`)
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

    const validationErrors = validateBalanceAccountForm(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    updateMutation.mutate({ name: values.name.trim(), balance: Number(values.balance) })
  }

  const submitErrorMessage = updateMutation.isError
    ? updateMutation.error instanceof ApiError
      ? updateMutation.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : null

  const isPrefilling = accountQuery.isPending || values === null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Saldo</DialogTitle>
          <DialogDescription>Perbarui nama dan saldo rekening.</DialogDescription>
        </DialogHeader>

        {isPrefilling ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <FormField label="Nama" htmlFor="edit-balance-account-name" required error={errors.name}>
              <Input
                id="edit-balance-account-name"
                value={values.name}
                onChange={(event) =>
                  setValues((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                }
                disabled={updateMutation.isPending}
              />
            </FormField>

            <FormField
              label="Saldo"
              htmlFor="edit-balance-account-balance"
              required
              error={errors.balance}
            >
              <Input
                id="edit-balance-account-balance"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={formatThousands(values.balance)}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, '')
                  setValues((prev) => (prev ? { ...prev, balance: digits } : prev))
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
