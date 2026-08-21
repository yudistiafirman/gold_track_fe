import { formatCurrency, formatDate } from '@/lib/format'
import type { TransactionReceipt, TransactionType } from '@/types/transaction-receipt'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const TYPE_LABELS: Record<TransactionType, { title: string; partyLabel: string }> = {
  SELL: { title: 'NOTA PENJUALAN', partyLabel: 'Pelanggan' },
  SELL_SUPPLIER: { title: 'NOTA JUAL BALIK', partyLabel: 'Supplier' },
  BUY: { title: 'NOTA PEMBELIAN (BUYBACK)', partyLabel: 'Pelanggan' },
}

function resolveParty(receipt: TransactionReceipt) {
  return receipt.type === 'SELL_SUPPLIER' ? receipt.supplier : receipt.customer
}

/**
 * Opens a print dialog formatted for the store's actual receipt setup: an
 * EPSON LX-300+II dot-matrix printer on 9.5x11in continuous (fanfold) form,
 * perforated in half ("bagi 2") into 9.5x5.5in sections. Plain monospace +
 * rule lines rather than logos/graphics — dot-matrix raster printing is
 * slow and unreliable on this class of printer, so this sticks to what
 * prints cleanly and fast. The OS printer driver still needs the
 * continuous-form stock (and a matching 9.5x5.5in custom paper size)
 * configured — this only controls what the browser sends to print.
 *
 * Guard: `TransactionReceipt`/`ReceiptItem` carry optional margin fields
 * (cost_price, profit, total_profit) shown on-screen to ADMIN/SUPER_ADMIN
 * (see transaction-receipt-page.tsx). Do NOT add them to the printed
 * template below — the printed receipt is handed to the customer and must
 * never expose cost/margin data, regardless of who clicks print.
 */
export function printReceipt(receipt: TransactionReceipt): void {
  const { title, partyLabel } = TYPE_LABELS[receipt.type]
  const party = resolveParty(receipt)

  const itemRows = receipt.items
    .map(
      (item, index) => `<tr>
        <td class="num">${index + 1}</td>
        <td>${escapeHtml(item.product_name)}<br/><span class="muted">SN: ${escapeHtml(item.serial_number)}</span></td>
        <td class="num">${item.weight_gram} gr</td>
        <td class="num">${formatCurrency(item.price_total)}</td>
      </tr>`,
    )
    .join('\n')

  const printWindow = window.open('', '_blank', 'width=900,height=1000')
  if (!printWindow) return

  printWindow.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Struk ${escapeHtml(receipt.transaction_code)}</title>
    <style>
      @page { size: 9.5in 5.5in; margin: 0.2in 0.5in; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; }
      body {
        font-family: 'Courier New', Courier, monospace;
        font-size: 11pt;
        font-weight: 700;
        color: #000;
        width: 8.5in;
      }
      .center { text-align: center; }
      .muted { color: #444; font-size: 9pt; }
      .store-name { font-size: 15pt; font-weight: 700; letter-spacing: 1px; }
      .rule { border-top: 1px dashed #000; margin: 3px 0; }
      .rule-double { border-top: 3px double #000; margin: 3px 0; }
      .title { font-size: 13pt; font-weight: 700; letter-spacing: 2px; margin: 3px 0; }
      .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 3px; }
      .meta-table td { padding: 0; vertical-align: top; }
      .meta-table td.label { width: 1.6in; }
      .meta-table td.colon { width: 0.2in; }
      table.items { width: 100%; border-collapse: collapse; margin: 3px 0; }
      table.items th, table.items td {
        border-bottom: 1px solid #000;
        padding: 1px 4px;
        text-align: left;
        vertical-align: top;
      }
      table.items thead th { border-bottom: 2px solid #000; font-weight: 700; }
      table.items td.num, table.items th.num { text-align: right; white-space: nowrap; }
      .totals-table { width: 100%; border-collapse: collapse; margin-top: 2px; }
      .totals-table td { padding: 1px 0; }
      .totals-table td.value { text-align: right; }
      .totals-table tr.grand td { font-size: 13pt; font-weight: 700; border-top: 2px solid #000; padding-top: 2px; }
      .signatures { width: 100%; border-collapse: collapse; margin-top: 0.1in; page-break-inside: avoid; }
      .signatures td { text-align: center; padding-top: 0.1in; }
      .signatures .line { border-top: 1px solid #000; margin: 0 0.4in; padding-top: 2px; }
      .footer { text-align: center; margin-top: 0.08in; font-size: 9pt; page-break-inside: avoid; }
    </style>
  </head>
  <body>
    <div class="center">
      <div class="store-name">${escapeHtml(receipt.store.name)}</div>
      <div>${escapeHtml(receipt.store.address)}</div>
      <div>Telp: ${escapeHtml(receipt.store.phone)}</div>
    </div>

    <div class="rule-double"></div>
    <div class="center title">${title}</div>
    <div class="rule"></div>

    <table class="meta-table">
      <tr>
        <td class="label">No. Transaksi</td><td class="colon">:</td><td>${escapeHtml(receipt.transaction_code)}</td>
      </tr>
      <tr>
        <td class="label">Tanggal</td><td class="colon">:</td><td>${formatDate(receipt.created_at)}</td>
      </tr>
      <tr>
        <td class="label">${partyLabel}</td><td class="colon">:</td><td>${party ? escapeHtml(party.name) : '-'}</td>
      </tr>
      <tr>
        <td class="label">Metode Bayar</td><td class="colon">:</td><td>${escapeHtml(receipt.payment_method)}${receipt.payment_ref ? ` (${escapeHtml(receipt.payment_ref)})` : ''}</td>
      </tr>
    </table>

    <table class="items">
      <thead>
        <tr>
          <th class="num">No</th>
          <th>Nama Barang</th>
          <th class="num">Berat</th>
          <th class="num">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <table class="totals-table">
      <tr>
        <td>Total Berat</td>
        <td class="value">${receipt.total_weight} gr</td>
      </tr>
      <tr class="grand">
        <td>TOTAL BAYAR</td>
        <td class="value">${formatCurrency(receipt.total_amount)}</td>
      </tr>
    </table>

    ${receipt.notes ? `<div class="rule"></div><div>Catatan: ${escapeHtml(receipt.notes)}</div>` : ''}

    <table class="signatures">
      <tr>
        <td style="width:50%">
          <div class="line">Kasir</div>
        </td>
        <td style="width:50%">
          <div class="line">${partyLabel}</div>
        </td>
      </tr>
    </table>

    <div class="footer">Terima kasih atas kepercayaan Anda</div>
  </body>
</html>`)
  printWindow.document.close()

  printWindow.onload = () => {
    printWindow.focus()
    printWindow.print()
  }
}
