import { type SubmitEvent, useState } from 'react'
import { FormField } from '@/components/form-field'
import { PickProductDialog } from '@/components/products/pick-product-dialog'
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
import { Label } from '@/components/ui/label'
import { formatCurrency, formatThousands } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/product'

export interface PurchaseOrderItemDraftInput {
  product: { id: string; name: string; sku: string }
  quantity: number
  purchasePrice: string
}

interface AddPurchaseOrderItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (item: PurchaseOrderItemDraftInput) => void
}

type PriceMode = 'unit' | 'gram'

interface FormValues {
  product: Product | null
  quantity: string
  priceInput: string
}

interface FormErrors {
  product?: string
  quantity?: string
  purchase_price?: string
}

function createInitialValues(): FormValues {
  return { product: null, quantity: '', priceInput: '' }
}

/**
 * Client-side only — items are staged in the parent page's draft list and
 * submitted together on POST /purchase-orders (FE-901). Stays open and
 * resets after each add so several products can be queued back-to-back
 * (AC1: "bisa tambah/hapus baris item sebelum submit").
 */
export function AddPurchaseOrderItemDialog({
  open,
  onOpenChange,
  onAdd,
}: AddPurchaseOrderItemDialogProps) {
  const [values, setValues] = useState<FormValues>(createInitialValues)
  const [priceMode, setPriceMode] = useState<PriceMode>('unit')
  const [errors, setErrors] = useState<FormErrors>({})
  const [pickProductOpen, setPickProductOpen] = useState(false)

  function handleClose() {
    setValues(createInitialValues())
    setPriceMode('unit')
    setErrors({})
    onOpenChange(false)
  }

  function handlePriceModeChange(nextMode: PriceMode) {
    setValues((prev) => {
      const weight = prev.product?.weight_gram
      if (nextMode === priceMode || !weight || !prev.priceInput) return prev
      const currentValue = Number(prev.priceInput)
      const converted = nextMode === 'gram' ? currentValue / weight : currentValue * weight
      return { ...prev, priceInput: String(Math.round(converted)) }
    })
    setPriceMode(nextMode)
  }

  /** Resolves whatever the user typed (per-unit or per-gram) down to the flat per-unit price the PO API expects. */
  function unitPriceFor(formValues: FormValues, mode: PriceMode): number {
    const raw = Number(formValues.priceInput || 0)
    return mode === 'gram' ? raw * (formValues.product?.weight_gram ?? 0) : raw
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationErrors: FormErrors = {}
    if (!values.product) validationErrors.product = 'Produk wajib dipilih'
    const quantity = Number(values.quantity)
    if (!values.quantity.trim()) {
      validationErrors.quantity = 'Quantity wajib diisi'
    } else if (!Number.isInteger(quantity) || quantity <= 0) {
      validationErrors.quantity = 'Quantity harus berupa bilangan bulat lebih dari 0'
    }
    const purchasePrice = unitPriceFor(values, priceMode)
    if (!values.priceInput.trim()) {
      validationErrors.purchase_price =
        priceMode === 'gram' ? 'Harga beli per gram wajib diisi' : 'Harga beli wajib diisi'
    } else if (Number.isNaN(purchasePrice) || purchasePrice <= 0) {
      validationErrors.purchase_price = 'Harga beli harus berupa angka lebih dari 0'
    }
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0 || !values.product) return

    onAdd({
      product: { id: values.product.id, name: values.product.name, sku: values.product.sku },
      quantity,
      purchasePrice: String(Math.round(purchasePrice)),
    })

    setValues(createInitialValues())
    setErrors({})
  }

  const computedUnitPrice = unitPriceFor(values, priceMode)
  const computedSubtotal = Number(values.quantity || 0) * computedUnitPrice

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(next) : handleClose())}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Tambah Item PO</DialogTitle>
            <DialogDescription>
              Item ditambahkan ke daftar — dialog tetap terbuka untuk menambah item lain.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <FormField label="Produk" htmlFor="po-item-product" required error={errors.product}>
              <Button
                type="button"
                variant="secondary"
                id="po-item-product"
                className="w-full justify-start font-normal"
                onClick={() => setPickProductOpen(true)}
              >
                {values.product
                  ? `${values.product.name} (${values.product.sku})`
                  : 'Pilih produk...'}
              </Button>
            </FormField>

            <FormField label="Quantity" htmlFor="po-item-quantity" required error={errors.quantity}>
              <Input
                id="po-item-quantity"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={values.quantity}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, '')
                  setValues((prev) => ({ ...prev, quantity: digits }))
                }}
              />
            </FormField>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="po-item-price" className="text-label text-gray-700">
                  Harga Beli
                  <span className="text-error"> *</span>
                </Label>
                <div className="flex items-center gap-0.5 rounded-md bg-muted p-0.5">
                  {(['unit', 'gram'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => handlePriceModeChange(mode)}
                      className={cn(
                        'rounded-sm px-2 py-1 text-caption font-medium transition-colors',
                        priceMode === mode
                          ? 'bg-card text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700',
                      )}
                    >
                      {mode === 'unit' ? 'Per Unit' : 'Per Gram'}
                    </button>
                  ))}
                </div>
              </div>
              <Input
                id="po-item-price"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={formatThousands(values.priceInput)}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, '')
                  setValues((prev) => ({ ...prev, priceInput: digits }))
                }}
              />
              {errors.purchase_price ? (
                <p className="text-caption text-error">{errors.purchase_price}</p>
              ) : priceMode === 'gram' && values.product && values.priceInput ? (
                <p className="text-caption text-gray-500">
                  Berat {values.product.weight_gram} gr · Harga/unit {formatCurrency(computedUnitPrice)}
                  {values.quantity && ` · Subtotal ${formatCurrency(computedSubtotal)}`}
                </p>
              ) : priceMode === 'unit' && values.quantity && values.priceInput ? (
                <p className="text-caption text-gray-500">Subtotal {formatCurrency(computedSubtotal)}</p>
              ) : null}
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={handleClose}>
                Selesai
              </Button>
              <Button type="submit">Tambah Item</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <PickProductDialog
        open={pickProductOpen}
        onOpenChange={setPickProductOpen}
        onSelect={(product) => setValues((prev) => ({ ...prev, product }))}
      />
    </>
  )
}
