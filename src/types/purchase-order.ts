import type { StockCondition } from '@/lib/domain-status'

export type PurchaseOrderStatus = 'BELUM_DITERIMA' | 'DITERIMA' | 'DIBATALKAN'

export interface PurchaseOrderSupplierRef {
  id: string
  name: string
}

/**
 * product_name is inferred — FE-901/902's contracts don't spell out the
 * item shape beyond the request's {product_id,quantity,purchase_price}, but
 * a display name is required to render item rows without an extra lookup
 * per product_id.
 */
export interface PurchaseOrderItem {
  product:{
id: string
  name: string
  }
  quantity: number
  purchase_price: number
}

export interface PurchaseOrder {
  id: string
  po_code: string
  supplier: PurchaseOrderSupplierRef
  total_amount: number
  status: PurchaseOrderStatus
  notes: string | null
  created_at: string
  received_at: string | null
}

/** FE-902: list responses omit items[] entirely — only Create/Get-detail/Receive populate it. */
export interface PurchaseOrderDetail extends PurchaseOrder {
  items: PurchaseOrderItem[]
}

export interface ReceivePurchaseOrderSerialInput {
  serial_number: string
  condition: StockCondition
}

export interface ReceivePurchaseOrderItemPayload {
  product_id: string
  serials: ReceivePurchaseOrderSerialInput[]
}

export interface ReceivePurchaseOrderPayload {
  items: ReceivePurchaseOrderItemPayload[]
}

export interface ReceivedUnit {
  stock_item_id: string
  barcode: string
  product_name: string
  serial_number: string
}

export interface ReceivePurchaseOrderResult extends PurchaseOrderDetail {
  received_units: ReceivedUnit[]
}
