export type SupplierTransactionSource = 'PURCHASE_ORDER' | 'SELL_SUPPLIER'

/** Header-only row — no items[], per FE-303. */
export interface SupplierTransactionRow {
  id: string
  source: SupplierTransactionSource
  code: string
  status: string
  total_amount: number
  created_at: string
}
