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

export const LOW_STOCK_TONE: StatusTone = 'error'

export type PoStatus = keyof typeof PO_STATUS_TONE
export type StockStatus = keyof typeof STOCK_STATUS_TONE
export type StockCondition = keyof typeof STOCK_CONDITION_TONE
export type OpnameResult = keyof typeof OPNAME_RESULT_TONE
