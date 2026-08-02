import { useQuery } from '@tanstack/react-query'
import { PackageCheck, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CancelPurchaseOrderDialog } from '@/components/purchase-orders/cancel-purchase-order-dialog'
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
import { PO_STATUS_TONE, resolveStatusTone } from '@/lib/domain-status'
import { formatCurrency, formatDate } from '@/lib/format'
import { NotFoundPage } from '@/pages/not-found-page'
import type { PurchaseOrderDetail } from '@/types/purchase-order'

export function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [cancelling, setCancelling] = useState<{ id: string; poCode: string } | null>(null)

  const poQuery = useQuery({
    queryKey: ['purchase-orders', id],
    queryFn: () => api.get<PurchaseOrderDetail>(`/purchase-orders/${id}`),
    enabled: id !== undefined,
    retry: false,
  })

  // Covers both 404 (not found) and 400 (invalid id) — ApiError doesn't carry
  // HTTP status, and both need the same graceful, non-crashing page.
  if (poQuery.isError) {
    return <NotFoundPage />
  }

  const po = poQuery.data
  const isLoading = poQuery.isPending || !po
  const canAct = po?.status === 'BELUM_DITERIMA'

  return (
    <div className="flex flex-col gap-6">
      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
      ) : (
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-h1 text-gray-900">{po.po_code}</h1>
              <StatusBadge tone={resolveStatusTone(PO_STATUS_TONE, po.status)} label={po.status} />
            </div>
            <p className="text-caption text-gray-500">
              Supplier: {po.supplier.name} · Dibuat {formatDate(po.created_at)}
              {po.received_at ? ` · Diterima ${formatDate(po.received_at)}` : ''}
            </p>
            {po.notes && <p className="text-caption text-gray-500">Catatan: {po.notes}</p>}
          </div>

          {canAct && (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setCancelling({ id: po.id, poCode: po.po_code })}
              >
                <X />
                Batalkan
              </Button>
              <Button asChild>
                <Link to={`/purchase-orders/${po.id}/receive`}>
                  <PackageCheck />
                  Terima Barang
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}

      {po && (
        <div className="flex flex-col gap-4">
          <h2 className="text-h3 text-gray-900">Item PO</h2>
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Harga Beli</TableHead>
                  <TableHead>Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {po.items.map((item) => (
                  <TableRow key={item.product.id}>
                    <TableCell>{item.product.name}</TableCell>
                    <TableCell className="text-table-num">{item.quantity}</TableCell>
                    <TableCell className="text-table-num">
                      {formatCurrency(item.purchase_price)}
                    </TableCell>
                    <TableCell className="text-table-num">
                      {formatCurrency(item.quantity * item.purchase_price)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end">
            <div className="flex w-full max-w-xs justify-between border-t border-border pt-3 text-h3 font-semibold text-gray-900">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(po.total_amount)}</span>
            </div>
          </div>
        </div>
      )}

      <CancelPurchaseOrderDialog purchaseOrder={cancelling} onClose={() => setCancelling(null)} />
    </div>
  )
}
