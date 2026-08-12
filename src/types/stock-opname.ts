import type { OpnameResult, OpnameSessionStatus, PhysicalStatus, StockStatus } from '@/lib/domain-status'

export interface StockOpnameSummary {
  match: number
  missing: number
  unexpected: number
  not_scanned: number
}

export interface StockOpname {
  id: string
  opname_code: string
  opname_date: string
  status: OpnameSessionStatus
  notes: string | null
  summary: StockOpnameSummary
  created_at: string
}

/**
 * Item shape for the completed session's items[] — inferred from the live
 * scan response's fields (system_status/physical_status/result), since
 * FE-1103 only says "object lengkap dgn items[] & summary" without
 * spelling out each item's shape. scanned_at is optional/best-effort: if
 * the BE includes it we show when a unit was scanned, otherwise we just
 * omit that line.
 */
export interface StockOpnameItem {
  id: string
  stock_item_id: string
  barcode: string
  product_name: string
  system_status: StockStatus
  physical_status: PhysicalStatus
  result: OpnameResult
  scanned_at?: string | null
}

export interface NotScannedItem {
  stock_item_id: string
  barcode: string
  sku: string
  product_name: string
  weight_gram: number
}

export interface NotScannedWeightGroup {
  weight_gram: number
  count: number
  total_weight_gram: number
}

/**
 * items may be absent/omitted depending on the endpoint, but is populated for both IN_PROGRESS (scans so far) and COMPLETED (final result) sessions.
 * not_scanned_items/not_scanned_by_weight are only populated while IN_PROGRESS — empty/absent once COMPLETED, same as summary.not_scanned resetting to 0.
 */
export interface StockOpnameDetail extends StockOpname {
  items?: StockOpnameItem[]
  not_scanned_items?: NotScannedItem[]
  not_scanned_by_weight?: NotScannedWeightGroup[]
}

/** A single scan's result — FE-1102's response is one item, not the whole session. MISSING can't occur from a live scan (it's only known once the session is completed and unscanned units are diffed). */
export interface ScanOpnameResult {
  id: string
  stock_item_id: string
  barcode: string
  product_name: string
  system_status: StockStatus
  physical_status: PhysicalStatus
  result: Extract<OpnameResult, 'MATCH' | 'UNEXPECTED'>
  not_scanned: number
  not_scanned_items?: NotScannedItem[]
  not_scanned_by_weight?: NotScannedWeightGroup[]
}
