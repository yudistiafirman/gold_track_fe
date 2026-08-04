import type { StockCondition } from '@/lib/domain-status'
import { validateProductionYear } from '@/lib/production-year'

export interface StockItemFormValues {
  serial_number: string
  condition: StockCondition | ''
  purchase_price: string
  purchase_date: string
  production_year: string
  notes: string
}

export interface StockItemFormErrors {
  serial_number?: string
  condition?: string
  purchase_price?: string
  production_year?: string
}

export function validateStockItemForm(values: StockItemFormValues): StockItemFormErrors {
  const errors: StockItemFormErrors = {}

  if (!values.serial_number.trim()) errors.serial_number = 'Serial number wajib diisi'
  if (!values.condition) errors.condition = 'Kondisi wajib dipilih'

  const price = Number(values.purchase_price)
  if (!values.purchase_price.trim()) {
    errors.purchase_price = 'Harga beli wajib diisi'
  } else if (Number.isNaN(price) || price <= 0) {
    errors.purchase_price = 'Harga beli harus berupa angka lebih dari 0'
  }

  const productionYearError = validateProductionYear(values.production_year)
  if (productionYearError) errors.production_year = productionYearError

  return errors
}
