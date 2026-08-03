export interface StockReportProduct {
  id: string
  name: string
  sku: string
}

export interface StockReportItem {
  product: StockReportProduct
  available_count: number
  good_count: number
  bad_count: number
  low_stock: boolean
}

export interface StockReport {
  threshold: number
  items: StockReportItem[]
}
