import JsBarcode from 'jsbarcode'
import type { StockItemLabel } from '@/types/stock-item'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Target module (single bar) width for reliable scanning on a 203dpi thermal
// printer with a basic handheld scanner — below ~0.25mm bars start dropping
// out; 0.33mm gives real margin. Width is capped at BARCODE_MAX_WIDTH_MM so
// it never overflows the 50mm label (44mm printable area + slack), only
// shrinking below the safe module width for barcode values long enough to
// not fit otherwise.
const BARCODE_MODULE_MM = 0.33
const BARCODE_MAX_WIDTH_MM = 46

export function renderBarcodeSvg(value: string): string {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  JsBarcode(svg, value, {
    format: 'CODE128',
    displayValue: false,
    margin: 0,
    height: 30,
    width: 1,
  })

  // jsbarcode's SVG renderer sets width/height as e.g. "266px" (string, unit
  // suffix included) — Number() on that is NaN, so this must use parseFloat.
  const naturalWidth = parseFloat(svg.getAttribute('width') ?? '') || 1
  const naturalHeight = parseFloat(svg.getAttribute('height') ?? '') || 1
  const widthMm = Math.min(BARCODE_MAX_WIDTH_MM, naturalWidth * BARCODE_MODULE_MM)
  const heightMm = naturalHeight * (widthMm / naturalWidth)

  svg.setAttribute('viewBox', `0 0 ${naturalWidth} ${naturalHeight}`)
  svg.setAttribute('width', `${widthMm}mm`)
  svg.setAttribute('height', `${heightMm}mm`)

  return new XMLSerializer().serializeToString(svg)
}

/**
 * TEMPORARY scan-readability test: encodes serial_number (short) instead of
 * the real backend barcode (long, doesn't fit 46mm at a safe module width).
 * Do NOT use these labels for real Sell/Buyback/Opname scans — the lookup
 * endpoints match against the `barcode` field, not serial_number, so a
 * label printed this way will fail to resolve. Revert to label.barcode once
 * the backend barcode format is shortened.
 */
function renderLabelHtml(label: StockItemLabel): string {
  const barcodeSvg = renderBarcodeSvg(label.barcode)
  return `<div class="label">
    <div class="product-name">${escapeHtml(label.product_name)}</div>
    ${barcodeSvg}
    <div class="barcode-value">${escapeHtml(label.barcode)}</div>
    <div class="serial">${escapeHtml(label.serial_number)}</div>
  </div>`
}

function buildLabelDocument(labelsHtml: string[]): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Cetak Label</title>
    <style>
      @page { size: 50mm 25mm; margin: 0; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; }
      .label {
        width: 50mm;
        height: 25mm;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.5mm;
        padding: 1.5mm 2mm;
        font-family: Arial, Helvetica, sans-serif;
        page-break-after: always;
        break-after: page;
      }
      .label:last-child { page-break-after: auto; break-after: auto; }
      .product-name {
        width: 100%;
        font-size: 7pt;
        font-weight: 700;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .barcode-value {
        width: 100%;
        font-size: 6.5pt;
        letter-spacing: 0.1px;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .serial {
        font-size: 6pt;
        letter-spacing: 0.3px;
      }
    </style>
  </head>
  <body>
    ${labelsHtml.join('\n')}
  </body>
</html>`
}

function openPrintWindow(html: string): void {
  const printWindow = window.open('', '_blank', 'width=400,height=300')
  if (!printWindow) return

  printWindow.document.write(html)
  printWindow.document.close()

  printWindow.onload = () => {
    printWindow.focus()
    printWindow.print()
  }
}

/**
 * Opens a print dialog for a single stock-item label, sized for the
 * store's actual label stock: 50x25mm direct-thermal rolls on a Xprinter
 * XP-420B. The OS printer driver still needs a matching 50x25mm media/stock
 * size configured — this only controls what the browser sends to print.
 */
export function printStockItemLabel(label: StockItemLabel): void {
  openPrintWindow(buildLabelDocument([renderLabelHtml(label)]))
}

/** Same as printStockItemLabel, but queues multiple labels as one print job (one page per label). */
export function printStockItemLabels(labels: StockItemLabel[]): void {
  if (labels.length === 0) return
  openPrintWindow(buildLabelDocument(labels.map(renderLabelHtml)))
}
