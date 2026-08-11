import { TransactionHistoryTable } from '@/components/transactions/transaction-history-table'

export function BuybackHistoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h1 text-gray-900">Riwayat Buyback</h1>
        <p className="text-caption text-gray-500">Daftar transaksi buyback dari pelanggan.</p>
      </div>
      <TransactionHistoryTable type="BUY" queryKeyPrefix="buyback-history" />
    </div>
  )
}
