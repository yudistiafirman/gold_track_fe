export interface TransactionItemResult {
  stock_item_id: string
  price_per_gram: number
  price_total: number
}

export interface TransactionResult {
  id: string
  transaction_code: string
  items: TransactionItemResult[]
}
