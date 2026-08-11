import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { StockCondition } from '@/lib/domain-status'
import type { StockItemLookupResult } from '@/types/stock-item-lookup'

export type SellTransactionType = 'SELL' | 'SELL_SUPPLIER'

export interface SellPartyRef {
  id: string
  name: string
}

export interface SellManualProductRef {
  id: string
  name: string
  sku: string
  weight_gram: number
}

export interface SellCartScanLine {
  kind: 'scan'
  item: StockItemLookupResult
  /** Raw digits, matching the thousands-formatted price input pattern used elsewhere. Total price for the unit, not per gram. */
  unitPrice: string
  /** True only if the item required (FE-703) and went through the BAD-condition confirm modal. */
  confirmed: boolean
}

export interface SellCartManualLine {
  kind: 'manual'
  /** Client-generated — the unit doesn't have a stock_item_id until checkout creates it server-side. */
  localId: string
  product: SellManualProductRef
  serialNumber: string
  condition: StockCondition
  /** Raw digits — total cost for the unit (cogs), not per gram. */
  costTotal: string
  productionYear: number | null
  /** Raw digits — total sale price for the unit, not per gram. */
  unitPrice: string
  confirmed: boolean
}

export type SellCartLine = SellCartScanLine | SellCartManualLine

export function sellLineId(line: SellCartLine): string {
  return line.kind === 'scan' ? line.item.id : line.localId
}

interface SellCartValues {
  type: SellTransactionType
  customer: SellPartyRef | null
  supplier: SellPartyRef | null
  lines: SellCartLine[]
  paymentMethod: string
  paymentRef: string
  notes: string
}

interface SellCartState extends SellCartValues {
  setType: (type: SellTransactionType) => void
  setCustomer: (customer: SellPartyRef | null) => void
  setSupplier: (supplier: SellPartyRef | null) => void
  /** Returns false (cart unchanged) if the unit is already in the cart. */
  addItem: (item: StockItemLookupResult, confirmed?: boolean) => boolean
  addManualItem: (
    item: Omit<SellCartManualLine, 'kind' | 'localId' | 'unitPrice' | 'confirmed'>,
    confirmed?: boolean,
  ) => void
  removeLine: (lineId: string) => void
  setLineUnitPrice: (lineId: string, value: string) => void
  setPaymentMethod: (value: string) => void
  setPaymentRef: (value: string) => void
  setNotes: (value: string) => void
  reset: () => void
}

const INITIAL_VALUES: SellCartValues = {
  type: 'SELL',
  customer: null,
  supplier: null,
  lines: [],
  paymentMethod: '',
  paymentRef: '',
  notes: '',
}

export const useSellCartStore = create<SellCartState>()(
  persist(
    (set, get) => ({
      ...INITIAL_VALUES,
      setType: (type) =>
        set({
          type,
          // Switching type invalidates whichever party belongs to the other type.
          customer: type === 'SELL' ? get().customer : null,
          supplier: type === 'SELL_SUPPLIER' ? get().supplier : null,
        }),
      setCustomer: (customer) => set({ customer }),
      setSupplier: (supplier) => set({ supplier }),
      addItem: (item, confirmed = false) => {
        if (get().lines.some((line) => line.kind === 'scan' && line.item.id === item.id)) {
          return false
        }
        set((state) => ({
          lines: [...state.lines, { kind: 'scan', item, unitPrice: '', confirmed }],
        }))
        return true
      },
      addManualItem: (item, confirmed = false) =>
        set((state) => ({
          lines: [
            ...state.lines,
            { kind: 'manual', localId: crypto.randomUUID(), ...item, unitPrice: '', confirmed },
          ],
        })),
      removeLine: (lineId) =>
        set((state) => ({
          lines: state.lines.filter((line) => sellLineId(line) !== lineId),
        })),
      setLineUnitPrice: (lineId, value) =>
        set((state) => ({
          lines: state.lines.map((line) =>
            sellLineId(line) === lineId ? { ...line, unitPrice: value } : line,
          ),
        })),
      setPaymentMethod: (value) => set({ paymentMethod: value }),
      setPaymentRef: (value) => set({ paymentRef: value }),
      setNotes: (value) => set({ notes: value }),
      reset: () => set(INITIAL_VALUES),
    }),
    {
      name: 'sell-cart',
      // Session-scoped: survives an accidental refresh mid-sale, but doesn't
      // linger across days the way localStorage would.
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
