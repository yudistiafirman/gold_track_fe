import { useMutation } from '@tanstack/react-query'
import { Loader2, ScanBarcode, ShoppingCart, StickyNote, Users, Wallet, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table/data-table'
import type { DataTableColumn } from '@/components/data-table/types'
import { OptionToggle } from '@/components/option-toggle'
import { PartyCard } from '@/components/party-card'
import { BarcodeScanInput } from '@/components/sell/barcode-scan-input'
import { ConfirmBadConditionDialog } from '@/components/sell/confirm-bad-condition-dialog'
import { PickCustomerDialog } from '@/components/sell/pick-customer-dialog'
import { PickSupplierDialog } from '@/components/sell/pick-supplier-dialog'
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
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import { formatCurrency, formatThousands } from '@/lib/format'
import { NON_CASH_METHODS } from '@/lib/payment-methods'
import { showSuccessToast } from '@/lib/toast'
import { type SellCartLine, useSellCartStore } from '@/store/sell-cart-store'
import type { StockItem } from '@/types/stock-item'
import type { StockItemLookupResult } from '@/types/stock-item-lookup'
import type { TransactionResult } from '@/types/transaction'

interface CheckoutItemPayload {
  stock_item_id: string
  price_total: number
  confirmed?: boolean
}

interface CheckoutPayload {
  type: 'SELL' | 'SELL_SUPPLIER'
  customer_id?: string
  supplier_id?: string
  payment_method: string
  payment_ref: string | null
  notes: string | null
  items: CheckoutItemPayload[]
}

function lineTotal(line: SellCartLine): number {
  const pricePerGram = Number(line.pricePerGram || 0)
  return pricePerGram * line.item.product.weight_gram
}

export function SellPage() {
  const navigate = useNavigate()
  const type = useSellCartStore((state) => state.type)
  const customer = useSellCartStore((state) => state.customer)
  const supplier = useSellCartStore((state) => state.supplier)
  const lines = useSellCartStore((state) => state.lines)
  const paymentMethod = useSellCartStore((state) => state.paymentMethod)
  const paymentRef = useSellCartStore((state) => state.paymentRef)
  const notes = useSellCartStore((state) => state.notes)
  const setType = useSellCartStore((state) => state.setType)
  const setCustomer = useSellCartStore((state) => state.setCustomer)
  const setSupplier = useSellCartStore((state) => state.setSupplier)
  const addItem = useSellCartStore((state) => state.addItem)
  const removeItem = useSellCartStore((state) => state.removeItem)
  const setPricePerGram = useSellCartStore((state) => state.setPricePerGram)
  const setPaymentMethod = useSellCartStore((state) => state.setPaymentMethod)
  const setPaymentRef = useSellCartStore((state) => state.setPaymentRef)
  const setNotes = useSellCartStore((state) => state.setNotes)
  const reset = useSellCartStore((state) => state.reset)

  const [pickCustomerOpen, setPickCustomerOpen] = useState(false)
  const [pickSupplierOpen, setPickSupplierOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [pendingConfirmItem, setPendingConfirmItem] = useState<StockItemLookupResult | null>(
    null,
  )

  // ApiError carries no HTTP status, so a 409 double-sell can't be told apart
  // from other checkout failures client-side. Re-validating every cart line
  // on ANY checkout error is a safe, no-op-if-nothing-changed way to satisfy
  // "409 -> item ditandai/dihapus dari keranjang otomatis" without that
  // distinction.
  async function revalidateCartAfterError() {
    const staleLines = useSellCartStore.getState().lines
    const removedLabels: string[] = []

    await Promise.all(
      staleLines.map(async (line) => {
        try {
          const fresh = await api.get<StockItem>(`/stock-items/${line.item.id}`)
          if (fresh.status !== 'AVAILABLE') {
            removeItem(line.item.id)
            removedLabels.push(`${line.item.product.name} (SN: ${line.item.serial_number})`)
          }
        } catch {
          // Unit no longer resolvable (e.g. deleted) — treat as unavailable too.
          removeItem(line.item.id)
          removedLabels.push(`${line.item.product.name} (SN: ${line.item.serial_number})`)
        }
      }),
    )

    if (removedLabels.length > 0) {
      toast.error(
        `${removedLabels.length} unit sudah terjual/tidak tersedia dan dihapus otomatis dari keranjang: ${removedLabels.join(', ')}. Silakan periksa kembali keranjang.`,
        { duration: 8000 },
      )
    }
  }

  const checkoutMutation = useMutation({
    mutationFn: (payload: CheckoutPayload) =>
      api.post<TransactionResult, CheckoutPayload>('/transactions', payload),
    onSuccess: (transaction) => {
      showSuccessToast(`Transaksi ${transaction.transaction_code} berhasil disimpan.`)
      reset()
      navigate(`/transactions/${transaction.id}`)
    },
    onError: () => {
      void revalidateCartAfterError()
    },
  })

  function addToCart(item: StockItemLookupResult, confirmed: boolean) {
    const added = addItem(item, confirmed)
    if (!added) {
      toast.info(`Unit ${item.serial_number} sudah ada di keranjang.`)
      return
    }
    showSuccessToast(`${item.product.name} ditambahkan ke keranjang.`)
  }

  function handleFound(item: StockItemLookupResult) {
    // FE-703: BAD-condition units sold to a customer need explicit
    // confirmation first — never for SELL_SUPPLIER (jual balik ke supplier).
    if (item.requires_confirmation && type === 'SELL') {
      setPendingConfirmItem(item)
      return
    }
    addToCart(item, false)
  }

  function focusBarcodeInput() {
    document.getElementById('barcode-scan-input')?.focus()
  }

  function handleConfirmBadCondition() {
    if (!pendingConfirmItem) return
    addToCart(pendingConfirmItem, true)
    setPendingConfirmItem(null)
    focusBarcodeInput()
  }

  function handleCancelBadCondition() {
    setPendingConfirmItem(null)
    focusBarcodeInput()
  }

  const isCash = paymentMethod === 'CASH'

  function handleCheckout() {
    if (lines.length === 0) {
      setFormError('Keranjang masih kosong.')
      return
    }
    if (type === 'SELL' && !customer) {
      setFormError('Pelanggan wajib dipilih untuk transaksi jual.')
      return
    }
    if (type === 'SELL_SUPPLIER' && !supplier) {
      setFormError('Supplier wajib dipilih untuk transaksi jual balik.')
      return
    }
    if (!isCash && !paymentMethod) {
      setFormError('Metode pembayaran non-tunai wajib dipilih.')
      return
    }
    setFormError(null)

    checkoutMutation.mutate({
      type,
      customer_id: type === 'SELL' ? customer?.id : undefined,
      supplier_id: type === 'SELL_SUPPLIER' ? supplier?.id : undefined,
      payment_method: paymentMethod,
      payment_ref: paymentRef.trim() || null,
      notes: notes.trim() || null,
      items: lines.map((line) => ({
        stock_item_id: line.item.id,
        price_total: lineTotal(line),
        ...(line.confirmed ? { confirmed: true } : {}),
      })),
    })
  }

  const grandTotal = useMemo(() => lines.reduce((sum, line) => sum + lineTotal(line), 0), [lines])

  const columns: DataTableColumn<SellCartLine>[] = [
    {
      id: 'product',
      header: 'Produk',
      cell: (line) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{line.item.product.name}</span>
          <span className="text-caption text-gray-500">
            {line.item.barcode} · SN: {line.item.serial_number}
          </span>
        </div>
      ),
    },
    {
      id: 'condition',
      header: 'Kondisi',
      cell: (line) =>
        line.item.condition === 'BAD' ? (
          <StatusBadge tone="warning" label="BAD" />
        ) : (
          <StatusBadge tone="success" label="GOOD" />
        ),
    },
    {
      id: 'weight',
      header: 'Berat',
      cell: (line) => `${line.item.product.weight_gram} gr`,
      className: 'text-table-num',
    },
    {
      id: 'purchase_price',
      header: 'Harga Modal',
      cell: (line) => formatCurrency(line.item.purchase_price),
      className: 'text-table-num',
    },
    {
      id: 'price_per_gram',
      header: 'Harga/gr',
      cell: (line) => (
        <Input
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={formatThousands(line.pricePerGram)}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, '')
            setPricePerGram(line.item.id, digits)
          }}
          disabled={checkoutMutation.isPending}
          className="w-32"
        />
      ),
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
          aria-label={`Hapus ${line.item.serial_number} dari keranjang`}
          onClick={() => removeItem(line.item.id)}
          disabled={checkoutMutation.isPending}
        >
          <X />
        </Button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h1 text-gray-900">Penjualan</h1>
        <p className="text-caption text-gray-500">Scan unit, susun keranjang, dan proses pembayaran.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: scan + cart */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-card p-6 shadow-card">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                <ScanBarcode className="size-4 text-primary" />
              </div>
              <h2 className="text-label text-gray-700 uppercase">Scan Barcode / SKU</h2>
            </div>
            <BarcodeScanInput type={type} onFound={handleFound} />
            <p className="text-caption text-gray-500">
              Tekan &apos;Enter&apos; untuk menambahkan otomatis.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-lg bg-gray-100">
                  <ShoppingCart className="size-4 text-gray-600" />
                </div>
                <h2 className="text-h3 text-gray-900">Keranjang</h2>
              </div>
              <Badge variant="outline">{lines.length} Item</Badge>
            </div>
            <DataTable
              columns={columns}
              data={lines}
              getRowId={(line) => line.item.id}
              emptyTitle="Keranjang kosong"
              emptyDescription="Scan barcode unit untuk mulai."
            />
          </div>
        </div>

        {/* Right: party, payment, notes, total */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-lg bg-gray-100">
                  <Users className="size-4 text-gray-600" />
                </div>
                <h2 className="text-h3 text-gray-900">
                  {type === 'SELL' ? 'Data Pelanggan' : 'Data Supplier'}
                </h2>
              </div>
              <OptionToggle
                name="party-type"
                value={type}
                onValueChange={(value) => setType(value as typeof type)}
                options={[
                  { value: 'SELL', label: 'Pelanggan' },
                  { value: 'SELL_SUPPLIER', label: 'Supplier' },
                ]}
                disabled={checkoutMutation.isPending}
              />
            </div>

            {type === 'SELL' ? (
              <PartyCard
                label="Pilih Pelanggan"
                party={customer}
                onPick={() => setPickCustomerOpen(true)}
                onClear={() => setCustomer(null)}
                disabled={checkoutMutation.isPending}
              />
            ) : (
              <PartyCard
                label="Pilih Supplier"
                party={supplier}
                onPick={() => setPickSupplierOpen(true)}
                onClear={() => setSupplier(null)}
                disabled={checkoutMutation.isPending}
              />
            )}
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
                name="payment-mode"
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
            <label htmlFor="sell-notes" className="flex items-center gap-2.5 text-label text-gray-700">
              <div className="flex size-7 items-center justify-center rounded-lg bg-gray-100">
                <StickyNote className="size-4 text-gray-600" />
              </div>
              Catatan
            </label>
            <Textarea
              id="sell-notes"
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
            {checkoutMutation.isError && (
              <p
                role="alert"
                className="rounded-sm border border-error/30 bg-error/10 px-3 py-2 text-caption text-error"
              >
                {checkoutMutation.error instanceof ApiError
                  ? checkoutMutation.error.message
                  : 'Terjadi kesalahan, silakan coba lagi.'}
              </p>
            )}

            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-body text-gray-500">Subtotal ({lines.length} Item)</span>
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
              {checkoutMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <ScanBarcode />
              )}
              {checkoutMutation.isPending ? 'Menyimpan...' : 'Bayar / Checkout'}
            </Button>
          </div>
        </div>
      </div>

      <PickCustomerDialog
        open={pickCustomerOpen}
        onOpenChange={setPickCustomerOpen}
        onSelect={setCustomer}
      />
      <PickSupplierDialog
        open={pickSupplierOpen}
        onOpenChange={setPickSupplierOpen}
        onSelect={setSupplier}
      />
      <ConfirmBadConditionDialog
        item={pendingConfirmItem}
        onConfirm={handleConfirmBadCondition}
        onCancel={handleCancelBadCondition}
      />
    </div>
  )
}
