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
  type ExternalFundFormValues,
  validateExternalFundForm,
} from '@/lib/external-fund-validation'
import { formatThousands } from '@/lib/format'
import { showSuccessToast } from '@/lib/toast'
import type { ExternalFund } from '@/types/external-fund'

interface CreateExternalFundPayload {
  description: string
  amount: number
}

function createInitialValues(): ExternalFundFormValues {
  return { description: '', amount: '' }
}

interface CreateExternalFundDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateExternalFundDialog({ open, onOpenChange }: CreateExternalFundDialogProps) {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<ExternalFundFormValues>(createInitialValues)
  const [errors, setErrors] = useState<ReturnType<typeof validateExternalFundForm>>({})

  const createMutation = useMutation({
    mutationFn: (payload: CreateExternalFundPayload) =>
      api.post<ExternalFund, CreateExternalFundPayload>('/external-funds', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-funds'] })
      showSuccessToast('Uang diluar berhasil ditambahkan.')
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

    const validationErrors = validateExternalFundForm(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    createMutation.mutate({
      description: values.description.trim(),
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
          <DialogTitle>Tambah Uang Diluar</DialogTitle>
          <DialogDescription>
            Catat uang yang masih di lapangan/belum settle.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <FormField
            label="Keterangan"
            htmlFor="external-fund-description"
            required
            error={errors.description}
            description="Boleh sertakan gramasi sebagai teks bebas, mis. &quot;Eliza Buyback 2 gram&quot;."
          >
            <Input
              id="external-fund-description"
              autoFocus
              placeholder="Eliza Buyback 2 gram"
              value={values.description}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, description: event.target.value }))
              }
              disabled={createMutation.isPending}
            />
          </FormField>

          <FormField label="Nominal" htmlFor="external-fund-amount" required error={errors.amount}>
            <Input
              id="external-fund-amount"
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
