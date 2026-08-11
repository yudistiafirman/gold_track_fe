import { type SubmitEvent, useState } from 'react'
import { FormField } from '@/components/form-field'
import { PickProductDialog } from '@/components/products/pick-product-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { StockCondition } from '@/lib/domain-status'
import { formatThousands } from '@/lib/format'
import { PRODUCTION_YEAR_MAX, PRODUCTION_YEAR_MIN, validateProductionYear } from '@/lib/production-year'
import { type SellTransactionType, useSellCartStore } from '@/store/sell-cart-store'
import type { Product } from '@/types/product'

interface AddManualSellItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: SellTransactionType
}

interface FormValues {
  product: Product | null
  serialNumber: string
  condition: StockCondition | ''
  productionYear: string
  costTotal: string
  badConfirmed: boolean
}

interface FormErrors {
  product?: string
  serial_number?: string
  condition?: string
  production_year?: string
  cost_total?: string
  bad_confirmed?: string
}

function createInitialValues(): FormValues {
  return {
    product: null,
    serialNumber: '',
    condition: '',
    productionYear: '',
    costTotal: '',
    badConfirmed: false,
  }
}

/**
 * Client-side only — items are staged in useSellCartStore and submitted
 * together on checkout, same pattern as AddBuybackItemDialog. Stays open and
 * resets its fields after each add so the kasir can add several units
 * back-to-back. Sale price is intentionally not collected here — it's edited
 * afterward via the existing "Harga/Unit" column in the cart table, shared
 * with scanned items.
 */
export function AddManualSellItemDialog({ open, onOpenChange, type }: AddManualSellItemDialogProps) {
  const addManualItem = useSellCartStore((state) => state.addManualItem)
  const [values, setValues] = useState<FormValues>(createInitialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [pickProductOpen, setPickProductOpen] = useState(false)

  const needsBadConfirmation = values.condition === 'BAD' && type === 'SELL'

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
    const costTotal = Number(values.costTotal)
    if (!values.costTotal.trim()) {
      validationErrors.cost_total = 'Harga modal wajib diisi'
    } else if (Number.isNaN(costTotal) || costTotal <= 0) {
      validationErrors.cost_total = 'Harga modal harus berupa angka lebih dari 0'
    }
    const productionYearError = validateProductionYear(values.productionYear)
    if (productionYearError) validationErrors.production_year = productionYearError
    if (values.condition === 'BAD' && type === 'SELL' && !values.badConfirmed) {
      validationErrors.bad_confirmed = 'Konfirmasi kondisi BAD wajib dicentang'
    }
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0 || !values.product || !values.condition) return

    addManualItem(
      {
        product: {
          id: values.product.id,
          name: values.product.name,
          sku: values.product.sku,
          weight_gram: values.product.weight_gram,
        },
        serialNumber: values.serialNumber.trim(),
        condition: values.condition,
        costTotal: values.costTotal,
        productionYear: values.productionYear.trim() ? Number(values.productionYear) : null,
      },
      needsBadConfirmation ? values.badConfirmed : false,
    )

    setValues(createInitialValues())
    setErrors({})
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(next) : handleClose())}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Tambah Item Manual</DialogTitle>
            <DialogDescription>
              Untuk emas yang bukan dari stok tercatat — item ditambahkan ke keranjang, dialog
              tetap terbuka untuk menambah item lain.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <FormField
              label="Produk"
              htmlFor="manual-sell-item-product"
              required
              error={errors.product}
            >
              <Button
                type="button"
                variant="secondary"
                id="manual-sell-item-product"
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
              htmlFor="manual-sell-item-serial"
              required
              error={errors.serial_number}
            >
              <Input
                id="manual-sell-item-serial"
                autoFocus
                value={values.serialNumber}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, serialNumber: event.target.value }))
                }
              />
            </FormField>

            <FormField
              label="Kondisi"
              htmlFor="manual-sell-item-condition"
              required
              error={errors.condition}
            >
              <Select
                value={values.condition}
                onValueChange={(value) =>
                  setValues((prev) => ({
                    ...prev,
                    condition: value as StockCondition,
                    badConfirmed: false,
                  }))
                }
              >
                <SelectTrigger id="manual-sell-item-condition" className="w-full">
                  <SelectValue placeholder="Pilih kondisi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GOOD">Good</SelectItem>
                  <SelectItem value="BAD">Bad</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            {needsBadConfirmation && (
              <div className="flex flex-col gap-1.5 rounded-md border border-warning/30 bg-warning/10 p-3">
                <div className="flex items-start gap-2.5">
                  <Checkbox
                    id="manual-sell-item-bad-confirmed"
                    checked={values.badConfirmed}
                    onCheckedChange={(checked) =>
                      setValues((prev) => ({ ...prev, badConfirmed: checked === true }))
                    }
                  />
                  <Label
                    htmlFor="manual-sell-item-bad-confirmed"
                    className="text-caption text-gray-700 font-normal"
                  >
                    Saya konfirmasi kondisi BAD sudah diinfokan ke pelanggan
                  </Label>
                </div>
                {errors.bad_confirmed && (
                  <p className="text-caption text-error">{errors.bad_confirmed}</p>
                )}
              </div>
            )}

            <FormField
              label="Tahun Produksi"
              htmlFor="manual-sell-item-production-year"
              description="Opsional"
              error={errors.production_year}
            >
              <Input
                id="manual-sell-item-production-year"
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
              label="Harga Modal"
              htmlFor="manual-sell-item-cost"
              required
              error={errors.cost_total}
              description={values.product ? `Berat ${values.product.weight_gram} gr` : undefined}
            >
              <Input
                id="manual-sell-item-cost"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={formatThousands(values.costTotal)}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, '')
                  setValues((prev) => ({ ...prev, costTotal: digits }))
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
