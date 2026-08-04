import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Printer } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  usePrintStockItemLabel,
  usePrintStockItemLabels,
} from '@/hooks/use-print-stock-item-label'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import type { StockCondition } from '@/lib/domain-status'
import { PRODUCTION_YEAR_MAX, PRODUCTION_YEAR_MIN, validateProductionYear } from '@/lib/production-year'
import { showSuccessToast } from '@/lib/toast'
import { NotFoundPage } from '@/pages/not-found-page'
import type {
  PurchaseOrderDetail,
  ReceivePurchaseOrderPayload,
  ReceivePurchaseOrderResult,
} from '@/types/purchase-order'

interface SerialSlot {
  serialNumber: string
  condition: StockCondition | ''
  productionYear: string
}

interface ItemReceiveState {
  slots: SerialSlot[]
}

export function ReceivePurchaseOrderPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [itemState, setItemState] = useState<Record<string, ItemReceiveState>>({})
  const [result, setResult] = useState<ReceivePurchaseOrderResult | null>(null)

  const printLabelMutation = usePrintStockItemLabel()
  const printLabelsMutation = usePrintStockItemLabels()

  const poQuery = useQuery({
    queryKey: ['purchase-orders', id],
    queryFn: () => api.get<PurchaseOrderDetail>(`/purchase-orders/${id}`),
    enabled: id !== undefined,
    retry: false,
  })

  const po = poQuery.data

  useEffect(() => {
    if (!po) return
    setItemState((prev) => {
      if (Object.keys(prev).length > 0) return prev
      const next: Record<string, ItemReceiveState> = {}
      for (const item of po.items) {
        next[item.product.id] = {
          slots: Array.from({ length: item.quantity }, () => ({
            serialNumber: '',
            condition: '',
            productionYear: '',
          })),
        }
      }
      return next
    })
  }, [po])

  const receiveMutation = useMutation({
    mutationFn: (payload: ReceivePurchaseOrderPayload) =>
      api.post<ReceivePurchaseOrderResult, ReceivePurchaseOrderPayload>(
        `/purchase-orders/${id}/receive`,
        payload,
      ),
    onSuccess: (received) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      showSuccessToast(`PO ${received.po_code} berhasil diterima.`)
      setResult(received)
    },
  })

  // Covers both 404 (not found) and 400 (invalid id) — ApiError doesn't carry
  // HTTP status, and both need the same graceful, non-crashing page.
  if (poQuery.isError) {
    return <NotFoundPage />
  }

  if (poQuery.isPending || !po) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // AC3: a PO that's already DITERIMA (or DIBATALKAN) can't be reopened for
  // receiving — guards direct navigation here after the button on the detail
  // page is hidden/status has since changed.
  if (po.status !== 'BELUM_DITERIMA' && !result) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-8 text-center shadow-card">
        <p className="text-body text-gray-700">
          PO {po.po_code} berstatus <strong>{po.status}</strong> dan tidak bisa diterima ulang.
        </p>
        <Button asChild variant="secondary">
          <Link to={`/purchase-orders/${po.id}`}>
            <ArrowLeft />
            Kembali ke Detail PO
          </Link>
        </Button>
      </div>
    )
  }

  function setSerialNumber(productId: string, index: number, value: string) {
    setItemState((prev) => ({
      ...prev,
      [productId]: {
        slots: prev[productId].slots.map((slot, i) =>
          i === index ? { ...slot, serialNumber: value } : slot,
        ),
      },
    }))
  }

  function setSlotCondition(productId: string, index: number, condition: StockCondition) {
    setItemState((prev) => ({
      ...prev,
      [productId]: {
        slots: prev[productId].slots.map((slot, i) => (i === index ? { ...slot, condition } : slot)),
      },
    }))
  }

  function setSlotProductionYear(productId: string, index: number, productionYear: string) {
    setItemState((prev) => ({
      ...prev,
      [productId]: {
        slots: prev[productId].slots.map((slot, i) =>
          i === index ? { ...slot, productionYear } : slot,
        ),
      },
    }))
  }

  const poItems = po.items

  const isReady = poItems.every((item) => {
    const state = itemState[item.product.id]
    if (!state || state.slots.length !== item.quantity) return false
    return state.slots.every(
      (slot) =>
        slot.serialNumber.trim() !== '' &&
        slot.condition !== '' &&
        !validateProductionYear(slot.productionYear),
    )
  })

  function handleSubmit() {
    if (!isReady || receiveMutation.isPending) return

    receiveMutation.mutate({
      items: poItems.map((item) => ({
        product_id: item.product.id,
        serials: itemState[item.product.id].slots.map((slot) => ({
          serial_number: slot.serialNumber.trim(),
          condition: slot.condition as StockCondition,
          production_year: slot.productionYear.trim() ? Number(slot.productionYear) : null,
        })),
      })),
    })
  }

  const checkoutErrorMessage = receiveMutation.isError
    ? receiveMutation.error instanceof ApiError
      ? receiveMutation.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : null

  if (result) {
    const allStockItemIds = result.received_units.map((unit) => unit.stock_item_id)

    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-h1 text-gray-900">Terima Barang PO</h1>

        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-lg border border-border bg-card p-8 shadow-card">
          <div>
            <h2 className="text-h2 text-gray-900">PO Diterima</h2>
            <p className="text-body text-gray-500">
              {result.po_code} · {result.received_units.length} unit baru ditambahkan ke stok.
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
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
                    Tahun Produksi
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Barcode
                  </th>
                  <th className="w-0 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {result.received_units.map((unit) => (
                  <tr key={unit.stock_item_id} className="border-t border-border">
                    <td className="px-4 py-3 text-gray-900">{unit.product_name}</td>
                    <td className="px-4 py-3 text-gray-900">{unit.serial_number}</td>
                    <td className="px-4 py-3 tabular-nums text-gray-900">
                      {unit.production_year ?? '—'}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-900">{unit.barcode}</td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Cetak label ${unit.serial_number}`}
                        disabled={
                          printLabelMutation.isPending &&
                          printLabelMutation.variables === unit.stock_item_id
                        }
                        onClick={() => printLabelMutation.mutate(unit.stock_item_id)}
                      >
                        {printLabelMutation.isPending &&
                        printLabelMutation.variables === unit.stock_item_id ? (
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
            <Button onClick={() => navigate(`/purchase-orders/${result.id}`)}>
              Kembali ke Detail PO
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-gray-900">Terima Barang PO {po.po_code}</h1>
          <p className="text-caption text-gray-500">
            Input serial number dan kondisi tiap unit sesuai quantity.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to={`/purchase-orders/${po.id}`}>
            <ArrowLeft />
            Kembali
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {po.items.map((item) => {
          const state = itemState[item.product.id]
          const filledCount =
            state?.slots.filter((slot) => slot.serialNumber.trim() !== '' && slot.condition !== '')
              .length ?? 0

          return (
            <div
              key={item.product.id}
              className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 shadow-card"
            >
              <div>
                <h2 className="text-h3 text-gray-900">{item.product.name}</h2>
                <p className="text-caption text-gray-500">
                  {filledCount}/{item.quantity} unit terisi
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {state?.slots.map((slot, index) => {
                  const productionYearError = validateProductionYear(slot.productionYear)
                  return (
                    <div key={index} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Input
                          value={slot.serialNumber}
                          onChange={(event) =>
                            setSerialNumber(item.product.id, index, event.target.value)
                          }
                          placeholder={`Serial #${index + 1}`}
                          disabled={receiveMutation.isPending}
                          className="flex-1"
                        />
                        <Select
                          value={slot.condition}
                          onValueChange={(value) =>
                            setSlotCondition(item.product.id, index, value as StockCondition)
                          }
                          disabled={receiveMutation.isPending}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Kondisi" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GOOD">Good</SelectItem>
                            <SelectItem value="BAD">Bad</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min={PRODUCTION_YEAR_MIN}
                          max={PRODUCTION_YEAR_MAX}
                          placeholder="Tahun produksi (opsional)"
                          value={slot.productionYear}
                          onChange={(event) =>
                            setSlotProductionYear(item.product.id, index, event.target.value)
                          }
                          disabled={receiveMutation.isPending}
                          className="w-44"
                        />
                      </div>
                      {productionYearError && (
                        <p className="text-caption text-error">{productionYearError}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {checkoutErrorMessage && (
        <p
          role="alert"
          className="rounded-sm border border-error/30 bg-error/10 px-3 py-2 text-caption text-error"
        >
          {checkoutErrorMessage}
        </p>
      )}

      <div className="flex justify-end">
        <Button size="lg" onClick={handleSubmit} disabled={!isReady || receiveMutation.isPending}>
          {receiveMutation.isPending && <Loader2 className="animate-spin" />}
          {receiveMutation.isPending ? 'Menyimpan...' : 'Terima Barang'}
        </Button>
      </div>
    </div>
  )
}
