import type { OpnameResult, OpnameSessionStatus, PhysicalStatus, StockStatus } from '@/lib/domain-status'

export interface StockOpnameSummary {
  match: number
  missing: number
  unexpected: number
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

/** items may be absent/omitted depending on the endpoint, but is populated for both IN_PROGRESS (scans so far) and COMPLETED (final result) sessions. */
export interface StockOpnameDetail extends StockOpname {
  items?: StockOpnameItem[]
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
}
