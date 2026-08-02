import type { StockItem } from '@/types/stock-item'

/**
 * price_total = price_per_gram × weight_gram (FE-702), which requires the
 * unit's weight — not present on the plain StockItem (weight lives on the
 * product, see FE-505's dedicated /label endpoint). Assuming the lookup
 * response embeds it on the product ref; not explicitly restated in FE-702's
 * ticket text, but required for the calculation to be possible at all.
 */
export interface StockItemLookupResult extends Omit<StockItem, 'product'> {
  product: StockItem['product'] & { weight_gram: number }
  requires_confirmation: boolean
}
