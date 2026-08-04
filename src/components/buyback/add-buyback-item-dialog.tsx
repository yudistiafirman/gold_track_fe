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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { StockCondition } from '@/lib/domain-status'
import { formatCurrency, formatThousands } from '@/lib/format'
import { PRODUCTION_YEAR_MAX, PRODUCTION_YEAR_MIN, validateProductionYear } from '@/lib/production-year'
import { useBuybackCartStore } from '@/store/buyback-cart-store'
import type { Product } from '@/types/product'

interface AddBuybackItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FormValues {
  product: Product | null
  serialNumber: string
  condition: StockCondition | ''
  productionYear: string
  pricePerGram: string
}

interface FormErrors {
  product?: string
  serial_number?: string
  condition?: string
  production_year?: string
  price_per_gram?: string
}

function createInitialValues(): FormValues {
  return { product: null, serialNumber: '', condition: '', productionYear: '', pricePerGram: '' }
}

/**
 * Client-side only — items are staged in useBuybackCartStore and submitted
 * together on checkout (FE-802). Stays open and resets its fields after each
 * add so the kasir can add several units back-to-back (AC2: "bisa tambah
 * lebih dari satu item dalam satu transaksi").
 */
export function AddBuybackItemDialog({ open, onOpenChange }: AddBuybackItemDialogProps) {
  const addItem = useBuybackCartStore((state) => state.addItem)
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
    if (!values.serialNumber.trim()) validationErrors.serial_number = 'Serial number wajib diisi'
    if (!values.condition) validationErrors.condition = 'Kondisi wajib dipilih'
    const pricePerGram = Number(values.pricePerGram)
    if (!values.pricePerGram.trim()) {
      validationErrors.price_per_gram = 'Harga beli per gram wajib diisi'
    } else if (Number.isNaN(pricePerGram) || pricePerGram <= 0) {
      validationErrors.price_per_gram = 'Harga beli per gram harus berupa angka lebih dari 0'
    }
    const productionYearError = validateProductionYear(values.productionYear)
    if (productionYearError) validationErrors.production_year = productionYearError
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0 || !values.product || !values.condition) return

    addItem({
      product: {
        id: values.product.id,
        name: values.product.name,
        sku: values.product.sku,
        weight_gram: values.product.weight_gram,
      },
      serial_number: values.serialNumber.trim(),
      condition: values.condition,
      production_year: values.productionYear.trim() ? Number(values.productionYear) : null,
      pricePerGram: values.pricePerGram,
    })

    setValues(createInitialValues())
    setErrors({})
  }

  const computedSubtotal = values.product
    ? Number(values.pricePerGram || 0) * values.product.weight_gram
    : 0

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(next) : handleClose())}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Tambah Item Buyback</DialogTitle>
            <DialogDescription>
              Item ditambahkan ke daftar — dialog tetap terbuka untuk menambah item lain.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <FormField
              label="Produk"
              htmlFor="buyback-item-product"
              required
              error={errors.product}
            >
              <Button
                type="button"
                variant="secondary"
                id="buyback-item-product"
                className="w-full justify-start font-normal"
                onClick={() => setPickProductOpen(true)}
              >
                {values.product
                  ? `${values.product.name} (${values.product.sku})`
                  : 'Pilih produk...'}
              </Button>
            </FormField>

            <FormField
              label="Serial Number"
              htmlFor="buyback-item-serial"
              required
              error={errors.serial_number}
            >
              <Input
                id="buyback-item-serial"
                autoFocus
                value={values.serialNumber}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, serialNumber: event.target.value }))
                }
              />
            </FormField>

            <FormField
              label="Kondisi"
              htmlFor="buyback-item-condition"
              required
              error={errors.condition}
            >
              <Select
                value={values.condition}
                onValueChange={(value) =>
                  setValues((prev) => ({ ...prev, condition: value as StockCondition }))
                }
              >
                <SelectTrigger id="buyback-item-condition" className="w-full">
                  <SelectValue placeholder="Pilih kondisi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GOOD">Good</SelectItem>
                  <SelectItem value="BAD">Bad</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label="Tahun Produksi"
              htmlFor="buyback-item-production-year"
              description="Opsional"
              error={errors.production_year}
            >
              <Input
                id="buyback-item-production-year"
                type="number"
                min={PRODUCTION_YEAR_MIN}
                max={PRODUCTION_YEAR_MAX}
                placeholder="Opsional"
                value={values.productionYear}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, productionYear: event.target.value }))
                }
              />
            </FormField>

            <FormField
              label="Harga Beli / Gram"
              htmlFor="buyback-item-price"
              required
              error={errors.price_per_gram}
              description={
                values.product
                  ? `Berat ${values.product.weight_gram} gr · Subtotal ${formatCurrency(computedSubtotal)}`
                  : undefined
              }
            >
              <Input
                id="buyback-item-price"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={formatThousands(values.pricePerGram)}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, '')
                  setValues((prev) => ({ ...prev, pricePerGram: digits }))
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
