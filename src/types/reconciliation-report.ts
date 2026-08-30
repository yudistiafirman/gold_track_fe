export interface ReconciliationReport {
  has_baseline: boolean
  /** Present only when `has_baseline` is true (absent, not null, otherwise). */
  last_closing_date?: string
  period_from?: string
  period_to?: string
  last_closing_saldo?: number
  period_revenue?: number
  period_cogs?: number
  period_expenses?: number
  period_net_profit?: number
  actual_total_balance: number
  actual_total_gold_value: number
  actual_saldo: number
  expected_saldo?: number
  difference?: number
  in_sync: boolean
}
