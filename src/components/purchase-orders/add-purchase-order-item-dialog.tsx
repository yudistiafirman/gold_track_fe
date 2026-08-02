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
import { formatCurrency, formatThousands } from '@/lib/format'
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

interface FormValues {
  product: Product | null
  quantity: string
  purchasePrice: string
}

interface FormErrors {
  product?: string
  quantity?: string
  purchase_price?: string
}

function createInitialValues(): FormValues {
  return { product: null, quantity: '', purchasePrice: '' }
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
  const [errors, setErrors] = useState<FormErrors>({})
  const [pickProductOpen, setPickProductOpen] = useState(false)

  function handleClose() {
    setValues(createInitialValues())
    setErrors({})
    onOpenChange(false)
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
    const purchasePrice = Number(values.purchasePrice)
    if (!values.purchasePrice.trim()) {
      validationErrors.purchase_price = 'Harga beli wajib diisi'
    } else if (Number.isNaN(purchasePrice) || purchasePrice <= 0) {
      validationErrors.purchase_price = 'Harga beli harus berupa angka lebih dari 0'
    }
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0 || !values.product) return

    onAdd({
      product: { id: values.product.id, name: values.product.name, sku: values.product.sku },
      quantity,
      purchasePrice: values.purchasePrice,
    })

    setValues(createInitialValues())
    setErrors({})
  }

  const computedSubtotal = Number(values.quantity || 0) * Number(values.purchasePrice || 0)

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

            <FormField
              label="Harga Beli (per unit)"
              htmlFor="po-item-price"
              required
              error={errors.purchase_price}
              description={
                values.quantity && values.purchasePrice
                  ? `Subtotal ${formatCurrency(computedSubtotal)}`
                  : undefined
              }
            >
              <Input
                id="po-item-price"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={formatThousands(values.purchasePrice)}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, '')
                  setValues((prev) => ({ ...prev, purchasePrice: digits }))
                }}
              />
            </FormField>

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
