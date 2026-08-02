import { CreditCard, Landmark, QrCode, Wallet } from 'lucide-react'
import type { ComponentType } from 'react'

export interface NonCashMethodOption {
  value: string
  label: string
  icon: ComponentType<{ className?: string }>
}

// No real payment-brand logos available here, so each option gets a generic
// category icon (bank / QR / card / e-wallet) instead of fabricated logos.
export const NON_CASH_METHODS: NonCashMethodOption[] = [
  { value: 'TRANSFER', label: 'Transfer Bank', icon: Landmark },
  { value: 'QRIS', label: 'QRIS', icon: QrCode },
  { value: 'DEBIT', label: 'Kartu Debit', icon: CreditCard },
  { value: 'KREDIT', label: 'Kartu Kredit', icon: CreditCard },
  { value: 'GOPAY', label: 'GoPay', icon: Wallet },
  { value: 'OVO', label: 'OVO', icon: Wallet },
  { value: 'DANA', label: 'DANA', icon: Wallet },
  { value: 'SHOPEEPAY', label: 'ShopeePay', icon: Wallet },
]
