export interface FinanceReportSalesRow {
  type: string
  transaction_count: number
  total_revenue: number
  total_cogs: number
  gross_profit: number
}

export interface FinanceReportExpenseRow {
  category: {
    id: string
    name: string
  }
  total_amount: number
}

export interface FinanceReport {
  from: string
  to: string
  sales_breakdown: FinanceReportSalesRow[]
  expense_breakdown: FinanceReportExpenseRow[]
  total_revenue: number
  total_cogs: number
  gross_profit: number
  gross_margin_percent: number
  total_expenses: number
  net_profit: number
}
