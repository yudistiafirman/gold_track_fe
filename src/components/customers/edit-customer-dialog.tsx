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
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import {
  type CustomerFormErrors,
  type CustomerFormValues,
  validateCustomerForm,
} from '@/lib/customer-validation'
import { showErrorToast, showSuccessToast } from '@/lib/toast'
import type { Customer } from '@/types/customer'

interface UpdateCustomerPayload {
  name: string
  phone: string | null
  email: string | null
  id_type: string | null
  id_number: string | null
  address: string | null
  notes: string | null
  is_active: boolean
}

interface EditCustomerDialogProps {
  customerId: string | null
  onClose: () => void
}

export function EditCustomerDialog({ customerId, onClose }: EditCustomerDialogProps) {
  const queryClient = useQueryClient()
  const open = customerId !== null
  const [values, setValues] = useState<CustomerFormValues | null>(null)
  const [errors, setErrors] = useState<CustomerFormErrors>({})
  const [isActive, setIsActive] = useState(true)

  const customerQuery = useQuery({
    queryKey: ['customers', customerId],
    queryFn: () => api.get<Customer>(`/customers/${customerId}`),
    enabled: open,
    retry: false,
  })

  useEffect(() => {
    if (customerQuery.data) {
      const customer = customerQuery.data
      setValues({
        name: customer.name,
        phone: customer.phone ?? '',
        email: customer.email ?? '',
        id_type: customer.id_type ?? '',
        id_number: customer.id_number ?? '',
        address: customer.address ?? '',
        notes: customer.notes ?? '',
      })
      setIsActive(customer.is_active)
    }
  }, [customerQuery.data])

  useEffect(() => {
    if (!customerQuery.isError) return
    showErrorToast(customerQuery.error, 'Pelanggan tidak ditemukan.')
    queryClient.invalidateQueries({ queryKey: ['customers'] })
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerQuery.isError])

  const updateCustomerMutation = useMutation({
    mutationFn: (payload: UpdateCustomerPayload) =>
      api.put<Customer, UpdateCustomerPayload>(`/customers/${customerId}`, payload),
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      showSuccessToast(`Pelanggan "${customer.name}" berhasil diperbarui.`)
      handleClose()
    },
  })

  function handleClose() {
    setValues(null)
    setErrors({})
    updateCustomerMutation.reset()
    onClose()
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!values || updateCustomerMutation.isPending) return

    const validationErrors = validateCustomerForm(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    updateCustomerMutation.mutate({
      name: values.name.trim(),
      phone: values.phone.trim() || null,
      email: values.email.trim() || null,
      id_type: values.id_type.trim() || null,
      id_number: values.id_number.trim() || null,
      address: values.address.trim() || null,
      notes: values.notes.trim() || null,
      is_active: isActive,
    })
  }

  const submitErrorMessage = updateCustomerMutation.isError
    ? updateCustomerMutation.error instanceof ApiError
      ? updateCustomerMutation.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : null

  const isPrefilling = customerQuery.isPending || values === null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Pelanggan</DialogTitle>
          <DialogDescription>Perbarui detail pelanggan.</DialogDescription>
        </DialogHeader>

        {isPrefilling ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <FormField label="Nama" htmlFor="edit-customer-name" required error={errors.name}>
              <Input
                id="edit-customer-name"
                value={values.name}
                onChange={(event) =>
                  setValues((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                }
                disabled={updateCustomerMutation.isPending}
              />
            </FormField>

            <FormField label="Telepon" htmlFor="edit-customer-phone" description="Opsional">
              <Input
                id="edit-customer-phone"
                type="tel"
                value={values.phone}
                onChange={(event) =>
                  setValues((prev) => (prev ? { ...prev, phone: event.target.value } : prev))
                }
                disabled={updateCustomerMutation.isPending}
              />
            </FormField>

            <FormField label="Email" htmlFor="edit-customer-email" description="Opsional">
              <Input
                id="edit-customer-email"
                type="email"
                value={values.email}
                onChange={(event) =>
                  setValues((prev) => (prev ? { ...prev, email: event.target.value } : prev))
                }
                disabled={updateCustomerMutation.isPending}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Jenis ID" htmlFor="edit-customer-id-type" description="Opsional">
                <Input
                  id="edit-customer-id-type"
                  placeholder="KTP"
                  value={values.id_type}
                  onChange={(event) =>
                    setValues((prev) => (prev ? { ...prev, id_type: event.target.value } : prev))
                  }
                  disabled={updateCustomerMutation.isPending}
                />
              </FormField>

              <FormField
                label="No. ID"
                htmlFor="edit-customer-id-number"
                description="Opsional"
              >
                <Input
                  id="edit-customer-id-number"
                  value={values.id_number}
                  onChange={(event) =>
                    setValues((prev) =>
                      prev ? { ...prev, id_number: event.target.value } : prev,
                    )
                  }
                  disabled={updateCustomerMutation.isPending}
                />
              </FormField>
            </div>

            <FormField label="Alamat" htmlFor="edit-customer-address" description="Opsional">
              <Textarea
                id="edit-customer-address"
                value={values.address}
                onChange={(event) =>
                  setValues((prev) => (prev ? { ...prev, address: event.target.value } : prev))
                }
                disabled={updateCustomerMutation.isPending}
              />
            </FormField>

            <FormField label="Catatan" htmlFor="edit-customer-notes" description="Opsional">
              <Textarea
                id="edit-customer-notes"
                value={values.notes}
                onChange={(event) =>
                  setValues((prev) => (prev ? { ...prev, notes: event.target.value } : prev))
                }
                disabled={updateCustomerMutation.isPending}
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
                disabled={updateCustomerMutation.isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={updateCustomerMutation.isPending}>
                {updateCustomerMutation.isPending && <Loader2 className="animate-spin" />}
                {updateCustomerMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
