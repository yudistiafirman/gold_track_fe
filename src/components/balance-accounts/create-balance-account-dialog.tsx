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
  type BalanceAccountFormValues,
  validateBalanceAccountForm,
} from '@/lib/balance-account-validation'
import { formatThousands } from '@/lib/format'
import { showSuccessToast } from '@/lib/toast'
import type { BalanceAccount } from '@/types/balance-account'

interface CreateBalanceAccountPayload {
  name: string
  balance: number
}

function createInitialValues(): BalanceAccountFormValues {
  return { name: '', balance: '' }
}

interface CreateBalanceAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateBalanceAccountDialog({
  open,
  onOpenChange,
}: CreateBalanceAccountDialogProps) {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<BalanceAccountFormValues>(createInitialValues)
  const [errors, setErrors] = useState<ReturnType<typeof validateBalanceAccountForm>>({})

  const createMutation = useMutation({
    mutationFn: (payload: CreateBalanceAccountPayload) =>
      api.post<BalanceAccount, CreateBalanceAccountPayload>('/balance-accounts', payload),
    onSuccess: (account) => {
      queryClient.invalidateQueries({ queryKey: ['balance-accounts'] })
      showSuccessToast(`Saldo "${account.name}" berhasil ditambahkan.`)
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

    const validationErrors = validateBalanceAccountForm(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    createMutation.mutate({ name: values.name.trim(), balance: Number(values.balance) })
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
          <DialogTitle>Tambah Saldo</DialogTitle>
          <DialogDescription>Rekening bank/cash baru untuk tracking kas.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <FormField label="Nama" htmlFor="balance-account-name" required error={errors.name}>
            <Input
              id="balance-account-name"
              autoFocus
              placeholder="BCA Bisnis"
              value={values.name}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, name: event.target.value }))
              }
              disabled={createMutation.isPending}
            />
          </FormField>

          <FormField
            label="Saldo"
            htmlFor="balance-account-balance"
            required
            error={errors.balance}
          >
            <Input
              id="balance-account-balance"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={formatThousands(values.balance)}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, '')
                setValues((prev) => ({ ...prev, balance: digits }))
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
              {createMutation.isPending ? 'Menyimpan...' : 'Simpan Saldo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
