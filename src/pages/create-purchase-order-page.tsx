import { useMutation } from '@tanstack/react-query'
import { Loader2, Plus, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AddPurchaseOrderItemDialog,
  type PurchaseOrderItemDraftInput,
} from '@/components/purchase-orders/add-purchase-order-item-dialog'
import { DataTable } from '@/components/data-table/data-table'
import type { DataTableColumn } from '@/components/data-table/types'
import { PartyCard } from '@/components/party-card'
import { PickSupplierDialog } from '@/components/sell/pick-supplier-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import { formatCurrency } from '@/lib/format'
import { showSuccessToast } from '@/lib/toast'
import type { PurchaseOrderDetail, PurchaseOrderSupplierRef } from '@/types/purchase-order'

interface DraftPOItem extends PurchaseOrderItemDraftInput {
  localId: string
}

interface CreatePurchaseOrderPayload {
  supplier_id: string
  notes: string | null
  items: { product_id: string; quantity: number; purchase_price: number }[]
}

function lineTotal(item: DraftPOItem): number {
  return item.quantity * Number(item.purchasePrice || 0)
}

export function CreatePurchaseOrderPage() {
  const navigate = useNavigate()
  const [supplier, setSupplier] = useState<PurchaseOrderSupplierRef | null>(null)
  const [items, setItems] = useState<DraftPOItem[]>([])
  const [notes, setNotes] = useState('')
  const [pickSupplierOpen, setPickSupplierOpen] = useState(false)
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (payload: CreatePurchaseOrderPayload) =>
      api.post<PurchaseOrderDetail, CreatePurchaseOrderPayload>('/purchase-orders', payload),
    onSuccess: (po) => {
      showSuccessToast(`PO ${po.po_code} berhasil dibuat.`)
      navigate(`/purchase-orders/${po.id}`)
    },
  })

  function addItem(item: PurchaseOrderItemDraftInput) {
    setItems((prev) => [...prev, { ...item, localId: crypto.randomUUID() }])
  }

  function removeItem(localId: string) {
    setItems((prev) => prev.filter((item) => item.localId !== localId))
  }

  function handleSubmit() {
    if (!supplier) {
      setFormError('Supplier wajib dipilih.')
      return
    }
    if (items.length === 0) {
      setFormError('Tambahkan minimal satu item.')
      return
    }
    setFormError(null)

    createMutation.mutate({
      supplier_id: supplier.id,
      notes: notes.trim() || null,
      items: items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        purchase_price: Number(item.purchasePrice || 0),
      })),
    })
  }

  const checkoutErrorMessage = createMutation.isError
    ? createMutation.error instanceof ApiError
      ? createMutation.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : null

  const grandTotal = useMemo(() => items.reduce((sum, item) => sum + lineTotal(item), 0), [items])

  const columns: DataTableColumn<DraftPOItem>[] = [
    {
      id: 'product',
      header: 'Produk',
      cell: (item) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{item.product.name}</span>
          <span className="text-caption text-gray-500">{item.product.sku}</span>
        </div>
      ),
    },
    {
      id: 'quantity',
      header: 'Qty',
      cell: (item) => item.quantity,
      className: 'text-table-num',
    },
    {
      id: 'purchase_price',
      header: 'Harga Beli',
      cell: (item) => formatCurrency(Number(item.purchasePrice || 0)),
      className: 'text-table-num',
    },
    {
      id: 'total',
      header: 'Subtotal',
      cell: (item) => formatCurrency(lineTotal(item)),
      className: 'text-table-num',
    },
    {
      id: 'actions',
      header: '',
      className: 'w-0',
      cell: (item) => (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Hapus ${item.product.name} dari daftar`}
          onClick={() => removeItem(item.localId)}
          disabled={createMutation.isPending}
        >
          <X />
        </Button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-gray-900">Buat Purchase Order</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: items */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-h3 text-gray-900">Item PO</h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{items.length} Item</Badge>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setAddItemOpen(true)}
                  disabled={createMutation.isPending}
                >
                  <Plus />
                  Tambah Item
                </Button>
              </div>
            </div>
            <DataTable
              columns={columns}
              data={items}
              getRowId={(item) => item.localId}
              emptyTitle="Belum ada item"
              emptyDescription="Klik 'Tambah Item' untuk mulai."
            />
          </div>
        </div>

        {/* Right: supplier, notes, total */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 shadow-card">
            <h2 className="text-h3 text-gray-900">Data Supplier</h2>
            <PartyCard
              label="Pilih Supplier"
              party={supplier}
              onPick={() => setPickSupplierOpen(true)}
              onClear={() => setSupplier(null)}
              disabled={createMutation.isPending}
            />
          </div>

          <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-card p-6 shadow-card">
            <label htmlFor="po-notes" className="text-label text-gray-700">
              Catatan
            </label>
            <Textarea
              id="po-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={createMutation.isPending}
              placeholder="Opsional"
            />
          </div>

          <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 shadow-card">
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
              <p className="text-caption text-gray-500">Total PO</p>
              <p className="text-h2 text-primary">{formatCurrency(grandTotal)}</p>
            </div>

            <Button size="lg" onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="animate-spin" />}
              {createMutation.isPending ? 'Menyimpan...' : 'Buat PO'}
            </Button>
          </div>
        </div>
      </div>

      <PickSupplierDialog
        open={pickSupplierOpen}
        onOpenChange={setPickSupplierOpen}
        onSelect={setSupplier}
      />
      <AddPurchaseOrderItemDialog
        open={addItemOpen}
        onOpenChange={setAddItemOpen}
        onAdd={addItem}
      />
    </div>
  )
}
