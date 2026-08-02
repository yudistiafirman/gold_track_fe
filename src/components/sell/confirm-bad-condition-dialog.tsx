import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { StockItemLookupResult } from '@/types/stock-item-lookup'

interface ConfirmBadConditionDialogProps {
  item: StockItemLookupResult | null
  onConfirm: () => void
  onCancel: () => void
}

/**
 * FE-703: unit-condition-BAD units sold to a customer (not SELL_SUPPLIER)
 * need an explicit cashier confirmation before they enter the cart, so
 * there's no ambiguity with the buyer about what they're getting.
 */
export function ConfirmBadConditionDialog({
  item,
  onConfirm,
  onCancel,
}: ConfirmBadConditionDialogProps) {
  const open = item !== null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Konfirmasi Kondisi Barang</DialogTitle>
          <DialogDescription>
            Unit ini berkondisi BAD. Pastikan pelanggan sudah tahu sebelum ditambahkan ke
            keranjang.
          </DialogDescription>
        </DialogHeader>

        {item && (
          <div className="flex flex-col gap-2 rounded-md border border-warning/30 bg-warning/10 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-body font-medium text-gray-900">{item.product.name}</span>
              <StatusBadge tone="warning" label="KONDISI BAD" />
            </div>
            <p className="text-caption text-gray-500">
              {item.barcode} · SN: {item.serial_number}
            </p>
            {item.notes && (
              <p className="text-caption text-gray-500">Catatan: {item.notes}</p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Batal
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            Konfirmasi &amp; Tambahkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
