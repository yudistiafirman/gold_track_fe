import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Printer } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api } from '@/lib/api/client'
import { TRANSACTION_STATUS_TONE, resolveStatusTone } from '@/lib/domain-status'
import { formatCurrency, formatDate } from '@/lib/format'
import { printReceipt } from '@/lib/print-receipt'
import { NotFoundPage } from '@/pages/not-found-page'
import type { TransactionReceipt, TransactionType } from '@/types/transaction-receipt'

const TYPE_LABELS: Record<TransactionType, { title: string; partyLabel: string }> = {
  SELL: { title: 'Nota Penjualan', partyLabel: 'Pelanggan' },
  SELL_SUPPLIER: { title: 'Nota Jual Balik', partyLabel: 'Supplier' },
  BUY: { title: 'Nota Pembelian (Buyback)', partyLabel: 'Pelanggan' },
}

function resolveParty(receipt: TransactionReceipt) {
  return receipt.type === 'SELL_SUPPLIER' ? receipt.supplier : receipt.customer
}

export function TransactionReceiptPage() {
  const { id } = useParams<{ id: string }>()

  const receiptQuery = useQuery({
    queryKey: ['transactions', id, 'receipt'],
    queryFn: () => api.get<TransactionReceipt>(`/transactions/${id}/receipt`),
    enabled: id !== undefined,
    retry: false,
  })

  // Covers both "not found" and "invalid id" the same way as supplier-detail-page —
  // ApiError doesn't carry HTTP status to tell them apart, and both need a
  // graceful, non-crashing page.
  if (receiptQuery.isError) {
    return <NotFoundPage />
  }

  const receipt = receiptQuery.data
  const isLoading = receiptQuery.isPending || !receipt

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link to="/sell">
            <ArrowLeft />
            Kembali ke Penjualan
          </Link>
        </Button>
        {receipt && (
          <Button onClick={() => printReceipt(receipt)}>
            <Printer />
            Cetak Struk
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-lg border border-border bg-card p-8 shadow-card">
          <div className="text-center">
            <h1 className="text-h2 text-gray-900">{receipt.store.name}</h1>
            <p className="text-caption text-gray-500">{receipt.store.address}</p>
            <p className="text-caption text-gray-500">Telp: {receipt.store.phone}</p>
          </div>

          <div className="flex items-center justify-between border-y border-border py-3">
            <div>
              <p className="text-caption text-gray-500">
                {TYPE_LABELS[receipt.type].title} · {receipt.transaction_code}
              </p>
              <p className="text-body font-medium text-gray-900">
                {formatDate(receipt.created_at)}
              </p>
            </div>
            <StatusBadge
              tone={resolveStatusTone(TRANSACTION_STATUS_TONE, receipt.status)}
              label={receipt.status}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-caption text-gray-500">{TYPE_LABELS[receipt.type].partyLabel}</p>
              <p className="text-body text-gray-900">{resolveParty(receipt)?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-caption text-gray-500">Metode Bayar</p>
              <p className="text-body text-gray-900">
                {receipt.payment_method}
                {receipt.payment_ref ? ` (${receipt.payment_ref})` : ''}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead>Kondisi</TableHead>
                  <TableHead>Berat</TableHead>
                  <TableHead>Hrg/gr</TableHead>
                  <TableHead>Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipt.items.map((item) => (
                  <TableRow key={item.stock_item_id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{item.product_name}</span>
                        <span className="text-caption text-gray-500">
                          {item.barcode} · SN: {item.serial_number}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{item.condition}</TableCell>
                    <TableCell className="text-table-num">{item.weight_gram} gr</TableCell>
                    <TableCell className="text-table-num">
                      {formatCurrency(item.price_per_gram)}
                    </TableCell>
                    <TableCell className="text-table-num">
                      {formatCurrency(item.price_total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {receipt.notes && (
            <p className="text-caption text-gray-500">Catatan: {receipt.notes}</p>
          )}

          <div className="flex flex-col items-end gap-1 border-t border-border pt-4">
            <div className="flex w-full max-w-xs justify-between text-body text-gray-500">
              <span>Total Berat</span>
              <span>{receipt.total_weight} gr</span>
            </div>
            <div className="flex w-full max-w-xs justify-between text-h3 font-semibold text-gray-900">
              <span>Total Bayar</span>
              <span className="text-primary">{formatCurrency(receipt.total_amount)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
