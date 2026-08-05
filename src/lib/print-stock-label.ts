import QRCode from 'qrcode'
import type { StockItemLabel } from '@/types/stock-item'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Kept small so product name + value + serial text still fit within the
// 25mm-tall label alongside it. Error correction 'M' is the standard
// reliability/density balance — verify actual scan reliability against the
// XP-420B print output before resizing further.
const QR_SIZE_MM = 12

export async function renderQrCodeSvg(value: string): Promise<string> {
  const svgString = await QRCode.toString(value, {
    type: 'svg',
    margin: 0,
    errorCorrectionLevel: 'M',
  })
  const svg = new DOMParser().parseFromString(svgString, 'image/svg+xml').documentElement
  svg.setAttribute('width', `${QR_SIZE_MM}mm`)
  svg.setAttribute('height', `${QR_SIZE_MM}mm`)
  return new XMLSerializer().serializeToString(svg)
}

async function renderLabelHtml(label: StockItemLabel): Promise<string> {
  const qrSvg = await renderQrCodeSvg(label.barcode)
  return `<div class="label">
    <div class="product-name">${escapeHtml(label.product_name)}</div>
    ${qrSvg}
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
export async function printStockItemLabel(label: StockItemLabel): Promise<void> {
  openPrintWindow(buildLabelDocument([await renderLabelHtml(label)]))
}

/** Same as printStockItemLabel, but queues multiple labels as one print job (one page per label). */
export async function printStockItemLabels(labels: StockItemLabel[]): Promise<void> {
  if (labels.length === 0) return
  const labelsHtml = await Promise.all(labels.map(renderLabelHtml))
  openPrintWindow(buildLabelDocument(labelsHtml))
}
