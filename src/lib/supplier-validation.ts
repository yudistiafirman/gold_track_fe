export interface SupplierFormValues {
  name: string
  phone: string
  address: string
  notes: string
}

export interface SupplierFormErrors {
  name?: string
}

export function validateSupplierForm(values: SupplierFormValues): SupplierFormErrors {
  const errors: SupplierFormErrors = {}

  if (!values.name.trim()) errors.name = 'Nama supplier wajib diisi'

  return errors
}
