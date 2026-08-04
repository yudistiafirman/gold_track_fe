import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, Gem, Loader2, Plus, Printer, Receipt, StickyNote, Users, Wallet, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AddBuybackItemDialog } from '@/components/buyback/add-buyback-item-dialog'
import { DataTable } from '@/components/data-table/data-table'
import type { DataTableColumn } from '@/components/data-table/types'
import { OptionToggle } from '@/components/option-toggle'
import { PartyCard } from '@/components/party-card'
import { PickCustomerDialog } from '@/components/sell/pick-customer-dialog'
import { StatusBadge } from '@/components/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  usePrintStockItemLabel,
  usePrintStockItemLabels,
} from '@/hooks/use-print-stock-item-label'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import { STOCK_CONDITION_TONE, type StockCondition } from '@/lib/domain-status'
import { formatCurrency } from '@/lib/format'
import { NON_CASH_METHODS } from '@/lib/payment-methods'
import { showSuccessToast } from '@/lib/toast'
import { type BuybackItemLine, useBuybackCartStore } from '@/store/buyback-cart-store'
import type { BuybackTransactionResult } from '@/types/buyback'

interface BuybackCheckoutItemPayload {
  product_id: string
  serial_number: string
  condition: StockCondition
  production_year: number | null
  price_total: number
}

interface BuybackCheckoutPayload {
  type: 'BUY'
  customer_id: string
  payment_method: string
  payment_ref: string | null
  notes: string | null
  items: BuybackCheckoutItemPayload[]
}

function lineTotal(line: BuybackItemLine): number {
  const pricePerGram = Number(line.pricePerGram || 0)
  return pricePerGram * line.product.weight_gram
}

export function BuybackPage() {
  const customer = useBuybackCartStore((state) => state.customer)
  const items = useBuybackCartStore((state) => state.items)
  const paymentMethod = useBuybackCartStore((state) => state.paymentMethod)
  const paymentRef = useBuybackCartStore((state) => state.paymentRef)
  const notes = useBuybackCartStore((state) => state.notes)
  const setCustomer = useBuybackCartStore((state) => state.setCustomer)
  const removeItem = useBuybackCartStore((state) => state.removeItem)
  const setPaymentMethod = useBuybackCartStore((state) => state.setPaymentMethod)
  const setPaymentRef = useBuybackCartStore((state) => state.setPaymentRef)
  const setNotes = useBuybackCartStore((state) => state.setNotes)
  const reset = useBuybackCartStore((state) => state.reset)

  const [pickCustomerOpen, setPickCustomerOpen] = useState(false)
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [result, setResult] = useState<BuybackTransactionResult | null>(null)
  // Snapshotted at submit time so the success panel can still show
  // product/serial per line after the cart itself is reset (AC1/consistency
  // with the Sell page: cart clears right away on success).
  const [submittedItems, setSubmittedItems] = useState<BuybackItemLine[]>([])

  const printLabelMutation = usePrintStockItemLabel()
  const printLabelsMutation = usePrintStockItemLabels()

  const checkoutMutation = useMutation({
    mutationFn: (payload: BuybackCheckoutPayload) =>
      api.post<BuybackTransactionResult, BuybackCheckoutPayload>('/transactions', payload),
    onSuccess: (transaction) => {
      showSuccessToast(`Transaksi ${transaction.transaction_code} berhasil disimpan.`)
      setResult(transaction)
      reset()
    },
  })

  // ApiError only carries a single code+message, no structured per-field
  // details — so "per-item" here is a best-effort heuristic: if the BE
  // message mentions a serial number that's in the cart, that row gets
  // flagged inline instead of just a floating toast.
  const checkoutErrorMessage = checkoutMutation.isError
    ? checkoutMutation.error instanceof ApiError
      ? checkoutMutation.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : null

  const erroredLocalIds = useMemo(() => {
    if (!checkoutErrorMessage) return new Set<string>()
    const lower = checkoutErrorMessage.toLowerCase()
    return new Set(
      items.filter((line) => lower.includes(line.serial_number.toLowerCase())).map((line) => line.localId),
    )
  }, [checkoutErrorMessage, items])

  const isCash = paymentMethod === 'CASH'

  function handleCheckout() {
    if (!customer) {
      setFormError('Pelanggan wajib dipilih.')
      return
    }
    if (items.length === 0) {
      setFormError('Tambahkan minimal satu item.')
      return
    }
    if (!isCash && !paymentMethod) {
      setFormError('Metode pembayaran non-tunai wajib dipilih.')
      return
    }
    setFormError(null)
    setSubmittedItems(items)

    checkoutMutation.mutate({
      type: 'BUY',
      customer_id: customer.id,
      payment_method: paymentMethod,
      payment_ref: paymentRef.trim() || null,
      notes: notes.trim() || null,
      items: items.map((line) => ({
        product_id: line.product.id,
        serial_number: line.serial_number,
        condition: line.condition,
        production_year: line.production_year,
        price_total: lineTotal(line),
      })),
    })
  }

  function handleNewTransaction() {
    checkoutMutation.reset()
    setResult(null)
    setSubmittedItems([])
  }

  const grandTotal = useMemo(() => items.reduce((sum, line) => sum + lineTotal(line), 0), [items])

  const columns: DataTableColumn<BuybackItemLine>[] = [
    {
      id: 'product',
      header: 'Produk',
      cell: (line) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{line.product.name}</span>
          <span className="text-caption text-gray-500">{line.product.sku}</span>
        </div>
      ),
    },
    {
      id: 'serial_number',
      header: 'Serial Number',
      cell: (line) => (
        <div className="flex flex-col">
          <span>{line.serial_number}</span>
          {erroredLocalIds.has(line.localId) && (
            <span className="text-caption text-error">Ditolak server — periksa item ini</span>
          )}
        </div>
      ),
    },
    {
      id: 'condition',
      header: 'Kondisi',
      cell: (line) => <StatusBadge tone={STOCK_CONDITION_TONE[line.condition]} label={line.condition} />,
    },
    {
      id: 'production_year',
      header: 'Tahun Produksi',
      cell: (line) => line.production_year ?? '—',
      className: 'text-table-num',
    },
    {
      id: 'weight',
      header: 'Berat',
      cell: (line) => `${line.product.weight_gram} gr`,
      className: 'text-table-num',
    },
    {
      id: 'price_per_gram',
      header: 'Harga/gr',
      cell: (line) => formatCurrency(Number(line.pricePerGram || 0)),
      className: 'text-table-num',
    },
    {
      id: 'total',
      header: 'Subtotal',
      cell: (line) => formatCurrency(lineTotal(line)),
      className: 'text-table-num',
    },
    {
      id: 'actions',
      header: '',
      className: 'w-0',
      cell: (line) => (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Hapus ${line.serial_number} dari daftar`}
          onClick={() => removeItem(line.localId)}
          disabled={checkoutMutation.isPending}
        >
          <X />
        </Button>
      ),
    },
  ]

  if (result) {
    const resultRows = submittedItems.map((line, index) => ({
      line,
      resultItem: result.items[index],
    }))
    const allStockItemIds = result.items.map((item) => item.stock_item_id)

    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-h1 text-gray-900">Buyback</h1>

        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-xl border border-border bg-card p-8 shadow-modal">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="size-6 text-green-700" />
            </div>
            <div>
              <h2 className="text-h2 text-gray-900">Transaksi Berhasil</h2>
              <p className="text-body text-gray-500">
                {result.transaction_code} · {resultRows.length} unit baru ditambahkan ke stok.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Produk
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Serial Number
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Barcode
                  </th>
                  <th className="w-0 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {resultRows.map(({ line, resultItem }) => (
                  <tr
                    key={line.localId}
                    className="border-t border-border transition-colors hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-gray-900">{line.product.name}</td>
                    <td className="px-4 py-3 text-gray-900">{line.serial_number}</td>
                    <td className="px-4 py-3 tabular-nums text-gray-900">
                      {resultItem?.barcode ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Cetak label ${line.serial_number}`}
                        disabled={
                          !resultItem ||
                          (printLabelMutation.isPending &&
                            printLabelMutation.variables === resultItem.stock_item_id)
                        }
                        onClick={() => resultItem && printLabelMutation.mutate(resultItem.stock_item_id)}
                      >
                        {printLabelMutation.isPending &&
                        printLabelMutation.variables === resultItem?.stock_item_id ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Printer />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              disabled={printLabelsMutation.isPending}
              onClick={() => printLabelsMutation.mutate(allStockItemIds)}
            >
              {printLabelsMutation.isPending ? <Loader2 className="animate-spin" /> : <Printer />}
              Cetak Semua Label
            </Button>
            <Button asChild variant="secondary">
              <Link to={`/transactions/${result.id}`}>
                <Receipt />
                Buka Struk
              </Link>
            </Button>
            <Button onClick={handleNewTransaction}>Transaksi Baru</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h1 text-gray-900">Buyback</h1>
        <p className="text-caption text-gray-500">Beli kembali barang dari pelanggan ke stok toko.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: items */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-lg bg-gray-100">
                  <Gem className="size-4 text-gray-600" />
                </div>
                <h2 className="text-h3 text-gray-900">Item Buyback</h2>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{items.length} Item</Badge>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setAddItemOpen(true)}
                  disabled={checkoutMutation.isPending}
                >
                  <Plus />
                  Tambah Item
                </Button>
              </div>
            </div>
            <DataTable
              columns={columns}
              data={items}
              getRowId={(line) => line.localId}
              emptyTitle="Belum ada item"
              emptyDescription="Klik 'Tambah Item' untuk mulai."
            />
          </div>
        </div>

        {/* Right: customer, payment, notes, total */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-gray-100">
                <Users className="size-4 text-gray-600" />
              </div>
              <h2 className="text-h3 text-gray-900">Data Pelanggan</h2>
            </div>
            <PartyCard
              label="Pilih Pelanggan"
              party={customer}
              onPick={() => setPickCustomerOpen(true)}
              onClear={() => setCustomer(null)}
              disabled={checkoutMutation.isPending}
            />
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-lg bg-gray-100">
                  <Wallet className="size-4 text-gray-600" />
                </div>
                <h2 className="text-h3 text-gray-900">Pembayaran</h2>
              </div>
              <OptionToggle
                name="buyback-payment-mode"
                value={isCash ? 'CASH' : 'NON_CASH'}
                onValueChange={(value) => setPaymentMethod(value === 'CASH' ? 'CASH' : '')}
                options={[
                  { value: 'CASH', label: 'Cash' },
                  { value: 'NON_CASH', label: 'Non-Cash' },
                ]}
                disabled={checkoutMutation.isPending}
              />
            </div>

            {!isCash && (
              <>
                <Select
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  disabled={checkoutMutation.isPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih metode pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    {NON_CASH_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        <method.icon className="size-4" />
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={paymentRef}
                  onChange={(event) => setPaymentRef(event.target.value)}
                  placeholder="No. referensi (opsional)"
                  disabled={checkoutMutation.isPending}
                />
              </>
            )}
          </div>

          <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-card p-6 shadow-card">
            <label htmlFor="buyback-notes" className="flex items-center gap-2.5 text-label text-gray-700">
              <div className="flex size-7 items-center justify-center rounded-lg bg-gray-100">
                <StickyNote className="size-4 text-gray-600" />
              </div>
              Catatan
            </label>
            <Textarea
              id="buyback-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={checkoutMutation.isPending}
              placeholder="Opsional"
            />
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-modal">
            {formError && (
              <p
                role="alert"
                className="rounded-sm border border-error/30 bg-error/10 px-3 py-2 text-caption text-error"
              >
                {formError}
              </p>
            )}
            {checkoutErrorMessage && (
              <p
                role="alert"
                className="rounded-sm border border-error/30 bg-error/10 px-3 py-2 text-caption text-error"
              >
                {checkoutErrorMessage}
              </p>
            )}

            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-body text-gray-500">Subtotal ({items.length} Item)</span>
              <span className="text-body font-medium text-gray-900">
                {formatCurrency(grandTotal)}
              </span>
            </div>
            <div>
              <p className="text-caption text-gray-500">Total Pembayaran</p>
              <p className="text-h1 tracking-tight text-primary tabular-nums">
                {formatCurrency(grandTotal)}
              </p>
            </div>

            <Button
              size="lg"
              onClick={handleCheckout}
              disabled={checkoutMutation.isPending}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              {checkoutMutation.isPending && <Loader2 className="animate-spin" />}
              {checkoutMutation.isPending ? 'Menyimpan...' : 'Simpan Buyback'}
            </Button>
          </div>
        </div>
      </div>

      <PickCustomerDialog
        open={pickCustomerOpen}
        onOpenChange={setPickCustomerOpen}
        onSelect={setCustomer}
      />
      <AddBuybackItemDialog open={addItemOpen} onOpenChange={setAddItemOpen} />
    </div>
  )
}
