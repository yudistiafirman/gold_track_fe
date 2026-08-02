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
  type SupplierFormErrors,
  type SupplierFormValues,
  validateSupplierForm,
} from '@/lib/supplier-validation'
import { showSuccessToast } from '@/lib/toast'
import type { Supplier } from '@/types/supplier'

interface CreateSupplierPayload {
  name: string
  phone: string
  address: string | null
  notes: string | null
}

const INITIAL_VALUES: SupplierFormValues = {
  name: '',
  phone: '',
  address: '',
  notes: '',
}

interface CreateSupplierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateSupplierDialog({ open, onOpenChange }: CreateSupplierDialogProps) {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<SupplierFormValues>(INITIAL_VALUES)
  const [errors, setErrors] = useState<SupplierFormErrors>({})

  const createSupplierMutation = useMutation({
    mutationFn: (payload: CreateSupplierPayload) =>
      api.post<Supplier, CreateSupplierPayload>('/suppliers', payload),
    onSuccess: (supplier) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      showSuccessToast(`Supplier "${supplier.name}" berhasil ditambahkan.`)
      handleClose()
    },
  })

  function handleClose() {
    setValues(INITIAL_VALUES)
    setErrors({})
    createSupplierMutation.reset()
    onOpenChange(false)
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (createSupplierMutation.isPending) return

    const validationErrors = validateSupplierForm(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    createSupplierMutation.mutate({
      name: values.name.trim(),
      phone: values.phone.trim(),
      address: values.address.trim() || null,
      notes: values.notes.trim() || null,
    })
  }

  const submitErrorMessage = createSupplierMutation.isError
    ? createSupplierMutation.error instanceof ApiError
      ? createSupplierMutation.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : null

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(next) : handleClose())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Supplier</DialogTitle>
          <DialogDescription>Isi detail supplier baru.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <FormField label="Nama Supplier" htmlFor="supplier-name" required error={errors.name}>
            <Input
              id="supplier-name"
              value={values.name}
              onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
              disabled={createSupplierMutation.isPending}
            />
          </FormField>

          <FormField label="No. HP" htmlFor="supplier-phone" required error={errors.phone}>
            <Input
              id="supplier-phone"
              type="tel"
              inputMode="numeric"
              value={values.phone}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  phone: event.target.value.replace(/\D/g, ''),
                }))
              }
              disabled={createSupplierMutation.isPending}
            />
          </FormField>

          <FormField label="Alamat" htmlFor="supplier-address" description="Opsional">
            <Textarea
              id="supplier-address"
              value={values.address}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, address: event.target.value }))
              }
              disabled={createSupplierMutation.isPending}
            />
          </FormField>

          <FormField label="Catatan" htmlFor="supplier-notes" description="Opsional">
            <Textarea
              id="supplier-notes"
              value={values.notes}
              onChange={(event) => setValues((prev) => ({ ...prev, notes: event.target.value }))}
              disabled={createSupplierMutation.isPending}
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
              disabled={createSupplierMutation.isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={createSupplierMutation.isPending}>
              {createSupplierMutation.isPending && <Loader2 className="animate-spin" />}
              {createSupplierMutation.isPending ? 'Menyimpan...' : 'Simpan Supplier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
