/**
 * Only stock_item_id/barcode per item is documented in FE-802's response
 * contract ("items[] berisi stock_item_id/barcode unit baru per item").
 * Matching each result back to the submitted line (for product name/serial
 * display) is done by array index, assuming the response preserves request
 * order — not explicitly guaranteed by the ticket, but the only reasonable
 * assumption without a shared key.
 */
export interface BuybackResultItem {
  stock_item_id: string
  barcode: string
}

export interface BuybackTransactionResult {
  id: string
  transaction_code: string
  items: BuybackResultItem[]
}
