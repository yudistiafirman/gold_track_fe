import type { StockCondition, StockStatus } from '@/lib/domain-status'

export interface StockItem {
  id: string
  product: {
    id: string
    name: string
  }
  barcode: string
  serial_number: string
  condition: StockCondition
  purchase_price: number
  purchase_date: string
  production_year: number | null
  status: StockStatus
  sold_at: string | null
  /** Absent (not null) when the unit hasn't been sold. */
  sold_to?: { type: 'CUSTOMER' | 'SUPPLIER'; id: string; name: string }
  notes: string | null
  created_at: string
  updated_at: string
}

export interface StockItemLabel {
  barcode: string
  product_name: string
  weight_gram: number
  serial_number: string
}
