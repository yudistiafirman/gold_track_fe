import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Printer } from 'lucide-react'
import { type SubmitEvent, useState } from 'react'
import { FormField } from '@/components/form-field'
import { StockLabelPreview } from '@/components/products/stock-label-preview'
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
import { usePrintStockItemLabel } from '@/hooks/use-print-stock-item-label'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import type { StockCondition } from '@/lib/domain-status'
import { formatThousands, todayDateInputValue } from '@/lib/format'
import {
  type StockItemFormValues,
  validateStockItemForm,
} from '@/lib/stock-item-validation'
import type { StockItem, StockItemLabel } from '@/types/stock-item'

interface CreateStockItemPayload {
  serial_number: string
  condition: StockCondition
  purchase_price: number
  purchase_date: string | null
  notes: string | null
}

function createInitialValues(): StockItemFormValues {
  return {
    serial_number: '',
    condition: '',
    purchase_price: '',
    purchase_date: todayDateInputValue(),
    notes: '',
  }
}

interface CreateStockItemDialogProps {
  productId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateStockItemDialog({
  productId,
  open,
  onOpenChange,
}: CreateStockItemDialogProps) {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<StockItemFormValues>(createInitialValues)
  const [errors, setErrors] = useState<ReturnType<typeof validateStockItemForm>>({})
  const [createdItem, setCreatedItem] = useState<StockItem | null>(null)
  const printLabelMutation = usePrintStockItemLabel()

  const createMutation = useMutation({
    mutationFn: (payload: CreateStockItemPayload) =>
      api.post<StockItem, CreateStockItemPayload>(
        `/products/${productId}/stock-items`,
        payload,
      ),
    onSuccess: (stockItem) => {
      queryClient.invalidateQueries({ queryKey: ['products', productId, 'stock-items'] })
      setCreatedItem(stockItem)
    },
  })

  const labelQuery = useQuery({
    queryKey: ['stock-items', createdItem?.id, 'label'],
    queryFn: () => api.get<StockItemLabel>(`/stock-items/${createdItem?.id}/label`),
    enabled: createdItem !== null,
  })

  function resetForm() {
    setValues(createInitialValues())
    setErrors({})
    createMutation.reset()
  }

  function handleClose() {
    resetForm()
    setCreatedItem(null)
    onOpenChange(false)
  }

  function handleAddAnother() {
    resetForm()
    setCreatedItem(null)
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (createMutation.isPending) return

    const validationErrors = validateStockItemForm(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    createMutation.mutate({
      serial_number: values.serial_number.trim(),
      condition: values.condition as StockCondition,
      purchase_price: Number(values.purchase_price),
      purchase_date: values.purchase_date || null,
      notes: values.notes.trim() || null,
    })
  }

  const submitErrorMessage = createMutation.isError
    ? createMutation.error instanceof ApiError
      ? createMutation.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : null

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(next) : handleClose())}>
      <DialogContent className="sm:max-w-md">
        {createdItem ? (
          <>
            <DialogHeader>
              <DialogTitle>Unit berhasil ditambahkan</DialogTitle>
              <DialogDescription>
                Tempel atau cetak barcode ini pada unit fisiknya.
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-center rounded-lg border border-border bg-muted/50 py-6">
              {labelQuery.data ? (
                <StockLabelPreview label={labelQuery.data} />
              ) : (
                <Loader2 className="animate-spin text-muted-foreground" />
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={handleAddAnother}>
                Tambah Unit Lain
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => createdItem && printLabelMutation.mutate(createdItem.id)}
                disabled={printLabelMutation.isPending}
              >
                {printLabelMutation.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Printer />
                )}
                Cetak Label
              </Button>
              <Button type="button" onClick={handleClose}>
                Selesai
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Tambah Unit Stok</DialogTitle>
              <DialogDescription>
                Barcode akan digenerate otomatis setelah disimpan.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              <FormField
                label="Serial Number"
                htmlFor="stock-serial"
                required
                error={errors.serial_number}
              >
                <Input
                  id="stock-serial"
                  value={values.serial_number}
                  onChange={(event) =>
                    setValues((prev) => ({ ...prev, serial_number: event.target.value }))
                  }
                  disabled={createMutation.isPending}
                />
              </FormField>

              <FormField
                label="Kondisi"
                htmlFor="stock-condition"
                required
                error={errors.condition}
              >
                <Select
                  value={values.condition}
                  onValueChange={(value) =>
                    setValues((prev) => ({ ...prev, condition: value as StockCondition }))
                  }
                  disabled={createMutation.isPending}
                >
                  <SelectTrigger id="stock-condition" className="w-full">
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
                htmlFor="stock-price"
                required
                error={errors.purchase_price}
              >
                <Input
                  id="stock-price"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formatThousands(values.purchase_price)}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, '')
                    setValues((prev) => ({ ...prev, purchase_price: digits }))
                  }}
                  disabled={createMutation.isPending}
                />
              </FormField>

              <FormField label="Tanggal Beli" htmlFor="stock-date" description="Opsional">
                <Input
                  id="stock-date"
                  type="date"
                  value={values.purchase_date}
                  onChange={(event) =>
                    setValues((prev) => ({ ...prev, purchase_date: event.target.value }))
                  }
                  disabled={createMutation.isPending}
                />
              </FormField>

              <FormField label="Catatan" htmlFor="stock-notes" description="Opsional">
                <Textarea
                  id="stock-notes"
                  value={values.notes}
                  onChange={(event) =>
                    setValues((prev) => ({ ...prev, notes: event.target.value }))
                  }
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
                  {createMutation.isPending ? 'Menyimpan...' : 'Simpan Unit'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
