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

// Store's handheld scanners only read 1D symbologies, so labels use CODE128
// (full ASCII support) instead of a QR code. Sized to fit the 50mm-wide
// label alongside the product name and serial text on a 25mm-tall label.
const BARCODE_WIDTH_MM = 40
const BARCODE_HEIGHT_MM = 10

export function renderBarcodeSvg(value: string): string {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  JsBarcode(svg, value, {
    format: 'CODE128',
    displayValue: false,
    margin: 0,
    height: 40,
  })
  svg.setAttribute('width', `${BARCODE_WIDTH_MM}mm`)
  svg.setAttribute('height', `${BARCODE_HEIGHT_MM}mm`)
  // Non-uniform scaling only changes bar height, not the width ratios between
  // bars that CODE128 decoding depends on — safe for a 1D symbology (unlike QR).
  svg.setAttribute('preserveAspectRatio', 'none')
  return new XMLSerializer().serializeToString(svg)
}

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
