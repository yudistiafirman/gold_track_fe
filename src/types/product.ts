export interface ProductRef {
  id: string
  name: string
}

export interface Product {
  id: string
  name: string
  sku: string
  category: ProductRef
  brand: ProductRef
  weight_gram: number
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}
