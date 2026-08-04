import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { StockCondition } from '@/lib/domain-status'

export interface BuybackPartyRef {
  id: string
  name: string
}

export interface BuybackProductRef {
  id: string
  name: string
  sku: string
  weight_gram: number
}

export interface BuybackItemLine {
  /** Client-generated — items don't have a server id until the transaction is submitted. */
  localId: string
  product: BuybackProductRef
  serial_number: string
  condition: StockCondition
  production_year: number | null
  /** Raw digits — price per gram, matching the Sell page's calculation (price/gram × weight_gram = subtotal). */
  pricePerGram: string
}

interface BuybackCartValues {
  customer: BuybackPartyRef | null
  items: BuybackItemLine[]
  paymentMethod: string
  paymentRef: string
  notes: string
}

interface BuybackCartState extends BuybackCartValues {
  setCustomer: (customer: BuybackPartyRef | null) => void
  addItem: (item: Omit<BuybackItemLine, 'localId'>) => void
  removeItem: (localId: string) => void
  setPaymentMethod: (value: string) => void
  setPaymentRef: (value: string) => void
  setNotes: (value: string) => void
  reset: () => void
}

const INITIAL_VALUES: BuybackCartValues = {
  customer: null,
  items: [],
  paymentMethod: '',
  paymentRef: '',
  notes: '',
}

export const useBuybackCartStore = create<BuybackCartState>()(
  persist(
    (set) => ({
      ...INITIAL_VALUES,
      setCustomer: (customer) => set({ customer }),
      addItem: (item) =>
        set((state) => ({
          items: [...state.items, { ...item, localId: crypto.randomUUID() }],
        })),
      removeItem: (localId) =>
        set((state) => ({
          items: state.items.filter((line) => line.localId !== localId),
        })),
      setPaymentMethod: (value) => set({ paymentMethod: value }),
      setPaymentRef: (value) => set({ paymentRef: value }),
      setNotes: (value) => set({ notes: value }),
      reset: () => set(INITIAL_VALUES),
    }),
    {
      name: 'buyback-cart',
      // Session-scoped: survives an accidental refresh mid-transaction, but
      // doesn't linger across days the way localStorage would.
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
