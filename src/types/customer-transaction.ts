export type CustomerTransactionType = 'SELL' | 'BUY'

export interface CustomerTransaction {
  id: string
  transaction_code: string
  type: CustomerTransactionType
  total_amount: number
  total_weight: number
  payment_method: string
  payment_ref: string | null
  status: string
  created_at: string
  completed_at: string | null
}
