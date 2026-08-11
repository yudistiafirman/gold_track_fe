export interface TransactionPartyRef {
  id: string
  name: string
}

export type TransactionListType = 'SELL' | 'BUY' | 'SELL_SUPPLIER'

export interface TransactionListItem {
  id: string
  transaction_code: string
  type: TransactionListType
  total_amount: number
  total_weight: number
  payment_method: string
  payment_ref: string
  status: string
  customer: TransactionPartyRef | null
  supplier: TransactionPartyRef | null
  created_at: string
  completed_at: string | null
}
