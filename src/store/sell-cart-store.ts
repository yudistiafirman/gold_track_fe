import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { StockItemLookupResult } from '@/types/stock-item-lookup'

export type SellTransactionType = 'SELL' | 'SELL_SUPPLIER'

export interface SellPartyRef {
  id: string
  name: string
}

export interface SellCartLine {
  item: StockItemLookupResult
  /** Raw digits, matching the thousands-formatted price input pattern used elsewhere. */
  pricePerGram: string
  /** True only if the item required (FE-703) and went through the BAD-condition confirm modal. */
  confirmed: boolean
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
  removeItem: (stockItemId: string) => void
  setPricePerGram: (stockItemId: string, value: string) => void
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
        if (get().lines.some((line) => line.item.id === item.id)) {
          return false
        }
        set((state) => ({
          lines: [...state.lines, { item, pricePerGram: '', confirmed }],
        }))
        return true
      },
      removeItem: (stockItemId) =>
        set((state) => ({
          lines: state.lines.filter((line) => line.item.id !== stockItemId),
        })),
      setPricePerGram: (stockItemId, value) =>
        set((state) => ({
          lines: state.lines.map((line) =>
            line.item.id === stockItemId ? { ...line, pricePerGram: value } : line,
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
