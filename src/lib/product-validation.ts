export interface ProductFormValues {
  name: string
  category_id: string
  brand_id: string
  weight_gram: string
  description: string
}

export interface ProductFormErrors {
  name?: string
  category_id?: string
  brand_id?: string
  weight_gram?: string
}

export function validateProductForm(values: ProductFormValues): ProductFormErrors {
  const errors: ProductFormErrors = {}

  if (!values.name.trim()) errors.name = 'Nama produk wajib diisi'
  if (!values.category_id) errors.category_id = 'Kategori wajib dipilih'
  if (!values.brand_id) errors.brand_id = 'Brand wajib dipilih'

  const weight = Number(values.weight_gram)
  if (!values.weight_gram.trim()) {
    errors.weight_gram = 'Berat wajib diisi'
  } else if (Number.isNaN(weight) || weight <= 0) {
    errors.weight_gram = 'Berat harus berupa angka lebih dari 0'
  }

  return errors
}
