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
  type SupplierFormErrors,
  type SupplierFormValues,
  validateSupplierForm,
} from '@/lib/supplier-validation'
import { showErrorToast, showSuccessToast } from '@/lib/toast'
import type { Supplier } from '@/types/supplier'

interface UpdateSupplierPayload {
  name: string
  phone: string
  address: string | null
  notes: string | null
  is_active: boolean
}

interface EditSupplierDialogProps {
  supplierId: string | null
  onClose: () => void
}

export function EditSupplierDialog({ supplierId, onClose }: EditSupplierDialogProps) {
  const queryClient = useQueryClient()
  const open = supplierId !== null
  const [values, setValues] = useState<SupplierFormValues | null>(null)
  const [errors, setErrors] = useState<SupplierFormErrors>({})
  const [isActive, setIsActive] = useState(true)

  const supplierQuery = useQuery({
    queryKey: ['suppliers', supplierId],
    queryFn: () => api.get<Supplier>(`/suppliers/${supplierId}`),
    enabled: open,
    retry: false,
  })

  useEffect(() => {
    if (supplierQuery.data) {
      setValues({
        name: supplierQuery.data.name,
        phone: supplierQuery.data.phone ?? '',
        address: supplierQuery.data.address ?? '',
        notes: supplierQuery.data.notes ?? '',
      })
      setIsActive(supplierQuery.data.is_active)
    }
  }, [supplierQuery.data])

  useEffect(() => {
    if (!supplierQuery.isError) return
    showErrorToast(supplierQuery.error, 'Supplier tidak ditemukan.')
    queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierQuery.isError])

  const updateSupplierMutation = useMutation({
    mutationFn: (payload: UpdateSupplierPayload) =>
      api.put<Supplier, UpdateSupplierPayload>(`/suppliers/${supplierId}`, payload),
    onSuccess: (supplier) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      showSuccessToast(`Supplier "${supplier.name}" berhasil diperbarui.`)
      handleClose()
    },
  })

  function handleClose() {
    setValues(null)
    setErrors({})
    updateSupplierMutation.reset()
    onClose()
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!values || updateSupplierMutation.isPending) return

    const validationErrors = validateSupplierForm(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    updateSupplierMutation.mutate({
      name: values.name.trim(),
      phone: values.phone.trim(),
      address: values.address.trim() || null,
      notes: values.notes.trim() || null,
      is_active: isActive,
    })
  }

  const submitErrorMessage = updateSupplierMutation.isError
    ? updateSupplierMutation.error instanceof ApiError
      ? updateSupplierMutation.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : null

  const isPrefilling = supplierQuery.isPending || values === null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Supplier</DialogTitle>
          <DialogDescription>Perbarui detail supplier.</DialogDescription>
        </DialogHeader>

        {isPrefilling ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <FormField
              label="Nama Supplier"
              htmlFor="edit-supplier-name"
              required
              error={errors.name}
            >
              <Input
                id="edit-supplier-name"
                value={values.name}
                onChange={(event) =>
                  setValues((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                }
                disabled={updateSupplierMutation.isPending}
              />
            </FormField>

            <FormField
              label="No. HP"
              htmlFor="edit-supplier-phone"
              required
              error={errors.phone}
            >
              <Input
                id="edit-supplier-phone"
                type="tel"
                inputMode="numeric"
                value={values.phone}
                onChange={(event) =>
                  setValues((prev) =>
                    prev ? { ...prev, phone: event.target.value.replace(/\D/g, '') } : prev,
                  )
                }
                disabled={updateSupplierMutation.isPending}
              />
            </FormField>

            <FormField label="Alamat" htmlFor="edit-supplier-address" description="Opsional">
              <Textarea
                id="edit-supplier-address"
                value={values.address}
                onChange={(event) =>
                  setValues((prev) => (prev ? { ...prev, address: event.target.value } : prev))
                }
                disabled={updateSupplierMutation.isPending}
              />
            </FormField>

            <FormField label="Catatan" htmlFor="edit-supplier-notes" description="Opsional">
              <Textarea
                id="edit-supplier-notes"
                value={values.notes}
                onChange={(event) =>
                  setValues((prev) => (prev ? { ...prev, notes: event.target.value } : prev))
                }
                disabled={updateSupplierMutation.isPending}
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
                disabled={updateSupplierMutation.isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={updateSupplierMutation.isPending}>
                {updateSupplierMutation.isPending && <Loader2 className="animate-spin" />}
                {updateSupplierMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
