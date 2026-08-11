import { TransactionHistoryTable } from '@/components/transactions/transaction-history-table'

export function SalesHistoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h1 text-gray-900">Riwayat Penjualan</h1>
        <p className="text-caption text-gray-500">Daftar transaksi penjualan ke pelanggan.</p>
      </div>
      <TransactionHistoryTable type="SELL" queryKeyPrefix="sell-history" />
    </div>
  )
}
