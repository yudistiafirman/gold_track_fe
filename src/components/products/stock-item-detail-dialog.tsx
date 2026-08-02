import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { DetailRow } from '@/components/detail-row'
import { StatusBadge } from '@/components/status-badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { api } from '@/lib/api/client'
import { STOCK_CONDITION_TONE, STOCK_STATUS_TONE } from '@/lib/domain-status'
import { formatCurrency, formatDate } from '@/lib/format'
import type { StockItem } from '@/types/stock-item'

interface StockItemDetailDialogProps {
  stockItemId: string | null
  onClose: () => void
}

export function StockItemDetailDialog({ stockItemId, onClose }: StockItemDetailDialogProps) {
  const open = stockItemId !== null

  const stockItemQuery = useQuery({
    queryKey: ['stock-items', stockItemId],
    queryFn: () => api.get<StockItem>(`/stock-items/${stockItemId}`),
    enabled: open,
  })

  const item = stockItemQuery.data

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detail Unit Stok</DialogTitle>
          <DialogDescription>{item?.product.name ?? 'Informasi lengkap unit stok.'}</DialogDescription>
        </DialogHeader>

        {stockItemQuery.isPending ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : item ? (
          <div className="flex flex-col">
            <DetailRow
              label="Barcode"
              value={<span className="text-table-num">{item.barcode}</span>}
            />
            <DetailRow
              label="Serial Number"
              value={<span className="text-table-num">{item.serial_number}</span>}
            />
            <DetailRow
              label="Kondisi"
              value={
                <StatusBadge tone={STOCK_CONDITION_TONE[item.condition]} label={item.condition} />
              }
            />
            <DetailRow
              label="Status"
              value={<StatusBadge tone={STOCK_STATUS_TONE[item.status]} label={item.status} />}
            />
            <DetailRow label="Harga Beli" value={formatCurrency(item.purchase_price)} />
            <DetailRow label="Tanggal Beli" value={formatDate(item.purchase_date)} />
            <DetailRow label="Terjual" value={formatDate(item.sold_at)} />
            <DetailRow label="Catatan" value={item.notes ?? '—'} />
          </div>
        ) : (
          <p className="py-6 text-center text-caption text-gray-500">Gagal memuat detail unit.</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
