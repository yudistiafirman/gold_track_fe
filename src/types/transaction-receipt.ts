export type TransactionType = 'SELL' | 'BUY' | 'SELL_SUPPLIER'

/**
 * Snapshotted at transaction time (AC1: "bukan data produk terbaru") — these
 * are NOT live product fields, they're copies as they were when the sale
 * happened, so the receipt stays accurate even if the product record
 * changes later.
 */
export interface ReceiptItem {
  stock_item_id: string
  product_name: string
  barcode: string
  serial_number: string
  condition: 'GOOD' | 'BAD'
  weight_gram: number
  price_per_gram: number
  price_total: number
}

export interface ReceiptParty {
  id: string
  name: string
  phone?: string | null
}

export interface ReceiptStore {
  name: string
  address: string
  phone: string
}

/**
 * Inferred shape — the ticket only documents the envelope's extra fields
 * (customer?, supplier?, store, invoice_url), not the full transaction
 * object shape. Filled in with fields consistent with the rest of the
 * app's transaction-related types (FE-602/FE-303/FE-702).
 */
export interface TransactionReceipt {
  id: string
  transaction_code: string
  type: TransactionType
  status: string
  payment_method: string
  payment_ref: string | null
  notes: string | null
  total_amount: number
  total_weight: number
  created_at: string
  completed_at: string | null
  customer?: ReceiptParty | null
  supplier?: ReceiptParty | null
  store: ReceiptStore
  invoice_url: string | null
  items: ReceiptItem[]
}
