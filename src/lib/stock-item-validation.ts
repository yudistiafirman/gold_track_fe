import type { StockCondition } from '@/lib/domain-status'

export interface StockItemFormValues {
  serial_number: string
  condition: StockCondition | ''
  purchase_price: string
  purchase_date: string
  notes: string
}

export interface StockItemFormErrors {
  serial_number?: string
  condition?: string
  purchase_price?: string
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

  return errors
}
