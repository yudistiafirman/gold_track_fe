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
import type { Customer } from '@/types/customer'

interface QuickCreateCustomerPayload {
  name: string
}

interface QuickCreateCustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with the newly created customer so the caller can use it immediately (e.g. select it in an in-progress transaction). */
  onCreated: (customer: Customer) => void
}

/**
 * Minimal "name only" create flow meant to be dropped into the transaction
 * screen (POS/Penjualan) so a cashier doesn't have to leave the sale to
 * register a walk-in customer. Standalone and controlled — no transaction
 * state assumed here, the caller decides what to do with the created customer.
 */
export function QuickCreateCustomerDialog({
  open,
  onOpenChange,
  onCreated,
}: QuickCreateCustomerDialogProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | undefined>()

  const createCustomerMutation = useMutation({
    mutationFn: (payload: QuickCreateCustomerPayload) =>
      api.post<Customer, QuickCreateCustomerPayload>('/customers', payload),
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      onCreated(customer)
      handleClose()
    },
  })

  function handleClose() {
    setName('')
    setError(undefined)
    createCustomerMutation.reset()
    onOpenChange(false)
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (createCustomerMutation.isPending) return

    if (!name.trim()) {
      setError('Nama pelanggan wajib diisi')
      return
    }
    setError(undefined)

    createCustomerMutation.mutate({ name: name.trim() })
  }

  const submitErrorMessage = createCustomerMutation.isError
    ? createCustomerMutation.error instanceof ApiError
      ? createCustomerMutation.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : null

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(next) : handleClose())}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Pelanggan Baru</DialogTitle>
          <DialogDescription>
            Tambah cepat, detail lain bisa dilengkapi nanti di halaman Pelanggan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <FormField label="Nama" htmlFor="quick-customer-name" required error={error}>
            <Input
              id="quick-customer-name"
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={createCustomerMutation.isPending}
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
              disabled={createCustomerMutation.isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={createCustomerMutation.isPending}>
              {createCustomerMutation.isPending && <Loader2 className="animate-spin" />}
              {createCustomerMutation.isPending ? 'Menyimpan...' : 'Simpan & Gunakan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
