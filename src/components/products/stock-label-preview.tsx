import { useMemo } from 'react'
import { renderBarcodeSvg } from '@/lib/print-stock-label'
import type { StockItemLabel } from '@/types/stock-item'

interface StockLabelPreviewProps {
  label: StockItemLabel
}

/**
 * Mirrors the physical label from print-stock-label.ts (50x25mm
 * direct-thermal, CODE128, same field order) so what the cashier sees
 * before printing matches what actually comes out of the printer.
 */
export function StockLabelPreview({ label }: StockLabelPreviewProps) {
  // TEMPORARY: encodes serial_number instead of label.barcode — see the
  // matching note in print-stock-label.ts's renderLabelHtml.
  const barcodeSvg = useMemo(() => renderBarcodeSvg(label.barcode), [label.barcode])

  return (
    <div className="flex w-[50mm] flex-col items-center gap-0.5 rounded-sm border border-dashed border-border bg-white px-2 py-1.5 font-sans">
      <span className="w-full truncate text-center text-[7pt] font-bold text-gray-900">
        {label.product_name}
      </span>
      <div
        className="flex w-full justify-center"
        dangerouslySetInnerHTML={{ __html: barcodeSvg }}
      />
      <span className="w-full truncate text-center text-[6.5pt] tracking-wide text-gray-900">
        {label.barcode}
      </span>
      <span className="text-[6pt] tracking-wide text-gray-500">{label.serial_number}</span>
    </div>
  )
}
