import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { NotScannedItem, NotScannedWeightGroup } from '@/types/stock-opname'

interface NotScannedBreakdownDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: NotScannedItem[]
  byWeight: NotScannedWeightGroup[]
}

export function NotScannedBreakdownDialog({
  open,
  onOpenChange,
  items,
  byWeight,
}: NotScannedBreakdownDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rincian Belum Discan</DialogTitle>
          <DialogDescription>
            Unit yang tercatat sebagai stok tersedia tapi belum ditemukan lewat scan di sesi ini.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-caption font-medium text-gray-500">Per Gramasi</h3>
            {byWeight.length === 0 ? (
              <p className="py-2 text-center text-caption text-gray-500">Tidak ada data.</p>
            ) : (
              <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
                {byWeight.map((group) => (
                  <div
                    key={group.weight_gram}
                    className="flex items-center justify-between px-3 py-2 text-body text-gray-900"
                  >
                    <span>{group.weight_gram} gr</span>
                    <span className="text-caption tabular-nums text-gray-500">
                      {group.count} unit ({group.total_weight_gram} gr)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="text-caption font-medium text-gray-500">Daftar Unit</h3>
            <div className="flex max-h-64 flex-col divide-y divide-border overflow-y-auto rounded-lg border border-border">
              {items.length === 0 ? (
                <p className="py-4 text-center text-caption text-gray-500">Tidak ada data.</p>
              ) : (
                items.map((item) => (
                  <div key={item.stock_item_id} className="flex flex-col gap-0.5 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-body text-gray-900">{item.product_name}</span>
                      <span className="text-caption tabular-nums text-gray-500">
                        {item.weight_gram} gr
                      </span>
                    </div>
                    <span className="text-caption tabular-nums text-gray-500">
                      {item.sku} · {item.barcode}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
