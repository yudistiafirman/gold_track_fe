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
import type { Supplier } from '@/types/supplier'

interface QuickCreateSupplierPayload {
  name: string
  phone: string
}

interface QuickCreateFormErrors {
  name?: string
  phone?: string
}

interface QuickCreateSupplierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with the newly created supplier so the caller can use it immediately (e.g. select it in an in-progress transaction). */
  onCreated: (supplier: Supplier) => void
}

/**
 * Minimal create flow (name + phone), same idea as QuickCreateCustomerDialog —
 * for picking a sell-back-to-supplier party from the POS screen without
 * leaving the transaction.
 */
export function QuickCreateSupplierDialog({
  open,
  onOpenChange,
  onCreated,
}: QuickCreateSupplierDialogProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState<QuickCreateFormErrors>({})

  const createSupplierMutation = useMutation({
    mutationFn: (payload: QuickCreateSupplierPayload) =>
      api.post<Supplier, QuickCreateSupplierPayload>('/suppliers', payload),
    onSuccess: (supplier) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      onCreated(supplier)
      handleClose()
    },
  })

  function handleClose() {
    setName('')
    setPhone('')
    setErrors({})
    createSupplierMutation.reset()
    onOpenChange(false)
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (createSupplierMutation.isPending) return

    const validationErrors: QuickCreateFormErrors = {}
    if (!name.trim()) validationErrors.name = 'Nama supplier wajib diisi'
    if (!phone.trim()) validationErrors.phone = 'No. HP wajib diisi'
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    createSupplierMutation.mutate({ name: name.trim(), phone: phone.trim() })
  }

  const submitErrorMessage = createSupplierMutation.isError
    ? createSupplierMutation.error instanceof ApiError
      ? createSupplierMutation.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : null

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(next) : handleClose())}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Supplier Baru</DialogTitle>
          <DialogDescription>
            Tambah cepat, detail lain bisa dilengkapi nanti di halaman Supplier.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <FormField label="Nama" htmlFor="quick-supplier-name" required error={errors.name}>
            <Input
              id="quick-supplier-name"
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={createSupplierMutation.isPending}
            />
          </FormField>

          <FormField label="No. HP" htmlFor="quick-supplier-phone" required error={errors.phone}>
            <Input
              id="quick-supplier-phone"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(event) => setPhone(event.target.value.replace(/\D/g, ''))}
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
              {createSupplierMutation.isPending ? 'Menyimpan...' : 'Simpan & Gunakan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
