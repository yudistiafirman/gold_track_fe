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
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import {
  type CustomerFormErrors,
  type CustomerFormValues,
  validateCustomerForm,
} from '@/lib/customer-validation'
import { showSuccessToast } from '@/lib/toast'
import type { Customer } from '@/types/customer'

interface CreateCustomerPayload {
  name: string
  phone: string
  email: string | null
  id_type: string | null
  id_number: string | null
  address: string | null
  notes: string | null
}

const INITIAL_VALUES: CustomerFormValues = {
  name: '',
  phone: '',
  email: '',
  id_type: '',
  id_number: '',
  address: '',
  notes: '',
}

interface CreateCustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateCustomerDialog({ open, onOpenChange }: CreateCustomerDialogProps) {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<CustomerFormValues>(INITIAL_VALUES)
  const [errors, setErrors] = useState<CustomerFormErrors>({})

  const createCustomerMutation = useMutation({
    mutationFn: (payload: CreateCustomerPayload) =>
      api.post<Customer, CreateCustomerPayload>('/customers', payload),
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      showSuccessToast(`Pelanggan "${customer.name}" berhasil ditambahkan.`)
      handleClose()
    },
  })

  function handleClose() {
    setValues(INITIAL_VALUES)
    setErrors({})
    createCustomerMutation.reset()
    onOpenChange(false)
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (createCustomerMutation.isPending) return

    const validationErrors = validateCustomerForm(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    createCustomerMutation.mutate({
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: values.email.trim() || null,
      id_type: values.id_type.trim() || null,
      id_number: values.id_number.trim() || null,
      address: values.address.trim() || null,
      notes: values.notes.trim() || null,
    })
  }

  const submitErrorMessage = createCustomerMutation.isError
    ? createCustomerMutation.error instanceof ApiError
      ? createCustomerMutation.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : null

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(next) : handleClose())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Pelanggan</DialogTitle>
          <DialogDescription>Isi detail pelanggan baru.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <FormField label="Nama" htmlFor="customer-name" required error={errors.name}>
            <Input
              id="customer-name"
              value={values.name}
              onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
              disabled={createCustomerMutation.isPending}
            />
          </FormField>

          <FormField label="No. HP" htmlFor="customer-phone" required error={errors.phone}>
            <Input
              id="customer-phone"
              type="tel"
              inputMode="numeric"
              value={values.phone}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  phone: event.target.value.replace(/\D/g, ''),
                }))
              }
              disabled={createCustomerMutation.isPending}
            />
          </FormField>

          <FormField label="Email" htmlFor="customer-email" description="Opsional">
            <Input
              id="customer-email"
              type="email"
              value={values.email}
              onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))}
              disabled={createCustomerMutation.isPending}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Jenis ID" htmlFor="customer-id-type" description="Opsional">
              <Input
                id="customer-id-type"
                placeholder="KTP"
                value={values.id_type}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, id_type: event.target.value }))
                }
                disabled={createCustomerMutation.isPending}
              />
            </FormField>

            <FormField label="No. ID" htmlFor="customer-id-number" description="Opsional">
              <Input
                id="customer-id-number"
                value={values.id_number}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, id_number: event.target.value }))
                }
                disabled={createCustomerMutation.isPending}
              />
            </FormField>
          </div>

          <FormField label="Alamat" htmlFor="customer-address" description="Opsional">
            <Textarea
              id="customer-address"
              value={values.address}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, address: event.target.value }))
              }
              disabled={createCustomerMutation.isPending}
            />
          </FormField>

          <FormField label="Catatan" htmlFor="customer-notes" description="Opsional">
            <Textarea
              id="customer-notes"
              value={values.notes}
              onChange={(event) => setValues((prev) => ({ ...prev, notes: event.target.value }))}
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
              {createCustomerMutation.isPending ? 'Menyimpan...' : 'Simpan Pelanggan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
