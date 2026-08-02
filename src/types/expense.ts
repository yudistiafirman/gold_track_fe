export interface ExpenseCategoryRef {
  id: string
  name: string
}

export interface Expense {
  id: string
  category: ExpenseCategoryRef
  amount: number
  description: string
  expense_date: string
  created_at: string
}
