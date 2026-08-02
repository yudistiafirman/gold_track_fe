export type TransactionReportType = 'SELL' | 'BUY' | 'SELL_SUPPLIER'

export interface TransactionReportBreakdownRow {
  type: TransactionReportType
  transaction_count: number
  total_amount: number
  total_weight: number
}

export interface TransactionReportTotal {
  transaction_count: number
  total_amount: number
  total_weight: number
}

export interface TransactionReport {
  from: string
  to: string
  breakdown: TransactionReportBreakdownRow[]
  total: TransactionReportTotal
}
