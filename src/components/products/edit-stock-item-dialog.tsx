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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import type { StockCondition } from '@/lib/domain-status'
import { formatThousands } from '@/lib/format'
import { PRODUCTION_YEAR_MAX, PRODUCTION_YEAR_MIN } from '@/lib/production-year'
import {
  type StockItemFormErrors,
  type StockItemFormValues,
  validateStockItemForm,
} from '@/lib/stock-item-validation'
import { showErrorToast, showSuccessToast } from '@/lib/toast'
import type { StockItem } from '@/types/stock-item'

interface UpdateStockItemPayload {
  serial_number: string
  condition: StockCondition
  purchase_price: number
  purchase_date: string | null
  production_year: number | null
  notes: string | null
}

interface EditStockItemDialogProps {
  stockItemId: string | null
  onClose: () => void
}

export function EditStockItemDialog({ stockItemId, onClose }: EditStockItemDialogProps) {
  const queryClient = useQueryClient()
  const open = stockItemId !== null
  const [values, setValues] = useState<StockItemFormValues | null>(null)
  const [errors, setErrors] = useState<StockItemFormErrors>({})

  const stockItemQuery = useQuery({
    queryKey: ['stock-items', stockItemId],
    queryFn: () => api.get<StockItem>(`/stock-items/${stockItemId}`),
    enabled: open,
    retry: false,
  })

  useEffect(() => {
    if (stockItemQuery.data) {
      const item = stockItemQuery.data
      setValues({
        serial_number: item.serial_number,
        condition: item.condition,
        purchase_price: String(item.purchase_price),
        purchase_date: item.purchase_date?.slice(0, 10) ?? '',
        production_year: item.production_year !== null ? String(item.production_year) : '',
        notes: item.notes ?? '',
      })
    }
  }, [stockItemQuery.data])

  useEffect(() => {
    if (!stockItemQuery.isError) return
    showErrorToast(stockItemQuery.error, 'Unit stok tidak ditemukan.')
    queryClient.invalidateQueries({ queryKey: ['products'] })
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockItemQuery.isError])

  const item = stockItemQuery.data
  const isSold = item?.status === 'SOLD'

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateStockItemPayload) =>
      api.put<StockItem, UpdateStockItemPayload>(`/stock-items/${stockItemId}`, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['products', updated.product.id, 'stock-items'] })
      queryClient.invalidateQueries({ queryKey: ['stock-items', stockItemId] })
      showSuccessToast(`Unit ${updated.serial_number} berhasil diperbarui.`)
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
    if (!values || updateMutation.isPending || isSold) return

    const validationErrors = validateStockItemForm(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    updateMutation.mutate({
      serial_number: values.serial_number.trim(),
      condition: values.condition as StockCondition,
      purchase_price: Number(values.purchase_price),
      purchase_date: values.purchase_date || null,
      production_year: values.production_year.trim() ? Number(values.production_year) : null,
      notes: values.notes.trim() || null,
    })
  }

  const submitErrorMessage = updateMutation.isError
    ? updateMutation.error instanceof ApiError
      ? updateMutation.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : null

  const fieldsDisabled = updateMutation.isPending || isSold

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Unit Stok</DialogTitle>
          <DialogDescription>Barcode dan produk tidak bisa diubah.</DialogDescription>
        </DialogHeader>

        {stockItemQuery.isPending || !values || !item ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <FormField label="Barcode" htmlFor="edit-stock-barcode">
              <Input id="edit-stock-barcode" value={item.barcode} disabled readOnly />
            </FormField>

            <FormField label="Produk" htmlFor="edit-stock-product">
              <Input id="edit-stock-product" value={item.product.name} disabled readOnly />
            </FormField>

            {isSold && (
              <p
                role="alert"
                className="rounded-sm border border-warning/30 bg-warning/10 px-3 py-2 text-caption text-warning"
              >
                Unit ini berstatus SOLD (sudah terjual) sehingga tidak bisa diedit.
              </p>
            )}

            <FormField
              label="Serial Number"
              htmlFor="edit-stock-serial"
              required
              error={errors.serial_number}
            >
              <Input
                id="edit-stock-serial"
                value={values.serial_number}
                onChange={(event) =>
                  setValues((prev) => (prev ? { ...prev, serial_number: event.target.value } : prev))
                }
                disabled={fieldsDisabled}
              />
            </FormField>

            <FormField
              label="Kondisi"
              htmlFor="edit-stock-condition"
              required
              error={errors.condition}
            >
              <Select
                value={values.condition}
                onValueChange={(value) =>
                  setValues((prev) => (prev ? { ...prev, condition: value as StockCondition } : prev))
                }
                disabled={fieldsDisabled}
              >
                <SelectTrigger id="edit-stock-condition" className="w-full">
                  <SelectValue placeholder="Pilih kondisi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GOOD">Good</SelectItem>
                  <SelectItem value="BAD">Bad</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label="Harga Beli"
              htmlFor="edit-stock-price"
              required
              error={errors.purchase_price}
            >
              <Input
                id="edit-stock-price"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={formatThousands(values.purchase_price)}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, '')
                  setValues((prev) => (prev ? { ...prev, purchase_price: digits } : prev))
                }}
                disabled={fieldsDisabled}
              />
            </FormField>

            <FormField label="Tanggal Beli" htmlFor="edit-stock-date" description="Opsional">
              <Input
                id="edit-stock-date"
                type="date"
                value={values.purchase_date}
                onChange={(event) =>
                  setValues((prev) => (prev ? { ...prev, purchase_date: event.target.value } : prev))
                }
                disabled={fieldsDisabled}
              />
            </FormField>

            <FormField
              label="Tahun Produksi"
              htmlFor="edit-stock-production-year"
              description="Opsional"
              error={errors.production_year}
            >
              <Input
                id="edit-stock-production-year"
                type="number"
                min={PRODUCTION_YEAR_MIN}
                max={PRODUCTION_YEAR_MAX}
                placeholder="Opsional"
                value={values.production_year}
                onChange={(event) =>
                  setValues((prev) =>
                    prev ? { ...prev, production_year: event.target.value } : prev,
                  )
                }
                disabled={fieldsDisabled}
              />
            </FormField>

            <FormField label="Catatan" htmlFor="edit-stock-notes" description="Opsional">
              <Textarea
                id="edit-stock-notes"
                value={values.notes}
                onChange={(event) =>
                  setValues((prev) => (prev ? { ...prev, notes: event.target.value } : prev))
                }
                disabled={fieldsDisabled}
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
                {isSold ? 'Tutup' : 'Batal'}
              </Button>
              {!isSold && (
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="animate-spin" />}
                  {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              )}
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
