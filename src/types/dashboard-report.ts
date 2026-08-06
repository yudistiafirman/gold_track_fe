import type { FinanceReport } from '@/types/finance-report'
import type { StockReportItem } from '@/types/stock-report'
import type { TransactionReportBreakdownRow, TransactionReportTotal } from '@/types/transaction-report'

export interface DashboardPendingPurchaseOrder {
  id: string
  po_code: string
  supplier_name: string
  total_amount: number
  created_at: string
}

export interface CashSummary {
  total_gold_value: number
  total_balance: number
  total_external_funds: number
  total_external_debts: number
}

export interface DashboardReport {
  from: string
  to: string
  finance: Omit<FinanceReport, 'from' | 'to'>
  transaction_breakdown: TransactionReportBreakdownRow[]
  transaction_total: TransactionReportTotal
  low_stock_threshold: number
  low_stock_items: StockReportItem[]
  pending_purchase_orders: DashboardPendingPurchaseOrder[]
  pending_purchase_orders_total: number
  cash_summary: CashSummary
}
