export type StatusTone = 'success' | 'warning' | 'error' | 'gray'

export const PO_STATUS_TONE = {
  BELUM_DITERIMA: 'warning',
  DITERIMA: 'success',
  DIBATALKAN: 'gray',
} as const satisfies Record<string, StatusTone>

export const STOCK_STATUS_TONE = {
  AVAILABLE: 'success',
  SOLD: 'gray',
} as const satisfies Record<string, StatusTone>

export const STOCK_CONDITION_TONE = {
  GOOD: 'success',
  BAD: 'warning',
} as const satisfies Record<string, StatusTone>

export const OPNAME_RESULT_TONE = {
  MATCH: 'success',
  MISSING: 'error',
  UNEXPECTED: 'warning',
} as const satisfies Record<string, StatusTone>

export const OPNAME_SESSION_STATUS_TONE = {
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
} as const satisfies Record<string, StatusTone>

export const PHYSICAL_STATUS_TONE = {
  FOUND: 'success',
  NOT_FOUND: 'error',
} as const satisfies Record<string, StatusTone>

/** Only COMPLETED is documented so far (FE-303) — other transaction statuses fall back to 'gray' via resolveStatusTone. */
export const TRANSACTION_STATUS_TONE = {
  COMPLETED: 'success',
} as const satisfies Record<string, StatusTone>

/** Higher privilege reads more prominent — matches the badge-color intent used across the app's tone maps. */
export const ROLE_TONE = {
  KASIR: 'gray',
  ADMIN: 'warning',
  SUPER_ADMIN: 'success',
} as const satisfies Record<string, StatusTone>

export const ACCOUNT_STATUS_TONE = {
  AKTIF: 'success',
  NONAKTIF: 'gray',
} as const satisfies Record<string, StatusTone>

export const LOW_STOCK_TONE: StatusTone = 'error'

export type PoStatus = keyof typeof PO_STATUS_TONE
export type StockStatus = keyof typeof STOCK_STATUS_TONE
export type StockCondition = keyof typeof STOCK_CONDITION_TONE
export type OpnameResult = keyof typeof OPNAME_RESULT_TONE
export type OpnameSessionStatus = keyof typeof OPNAME_SESSION_STATUS_TONE
export type PhysicalStatus = keyof typeof PHYSICAL_STATUS_TONE

/** Resolves a status badge tone for a mixed PO/transaction history row, defaulting to 'gray' for any undocumented status value instead of crashing. */
export function resolveStatusTone(
  statusMap: Record<string, StatusTone>,
  status: string,
): StatusTone {
  return statusMap[status] ?? 'gray'
}
