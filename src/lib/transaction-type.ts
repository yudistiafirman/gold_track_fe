import { RefreshCw, ShoppingCart, Truck } from 'lucide-react'
import type { TransactionReportType } from '@/types/transaction-report'

export const TRANSACTION_TYPE_LABELS: Record<TransactionReportType, string> = {
  SELL: 'Penjualan',
  BUY: 'Buyback',
  SELL_SUPPLIER: 'Jual ke Supplier',
}

export const TRANSACTION_TYPE_BADGE_CLASSES: Record<TransactionReportType, string> = {
  SELL: 'bg-green-100 text-green-700',
  BUY: 'bg-blue-100 text-blue-700',
  SELL_SUPPLIER: 'bg-pink-100 text-pink-700',
}

export const TRANSACTION_TYPE_BAR_CLASSES: Record<TransactionReportType, string> = {
  SELL: 'bg-green-500',
  BUY: 'bg-blue-500',
  SELL_SUPPLIER: 'bg-pink-500',
}

export const TRANSACTION_TYPE_ICONS: Record<TransactionReportType, React.ComponentType<{ className?: string }>> = {
  SELL: ShoppingCart,
  BUY: RefreshCw,
  SELL_SUPPLIER: Truck,
}

/** Defensive fallback for any transaction type not in the known set — avoids crashing on an unrecognized value from the API. */
export function transactionTypeLabel(type: string): string {
  return TRANSACTION_TYPE_LABELS[type as TransactionReportType] ?? type
}
