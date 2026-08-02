export interface SupplierFormValues {
  name: string
  phone: string
  address: string
  notes: string
}

export interface SupplierFormErrors {
  name?: string
  phone?: string
}

export function validateSupplierForm(values: SupplierFormValues): SupplierFormErrors {
  const errors: SupplierFormErrors = {}

  if (!values.name.trim()) errors.name = 'Nama supplier wajib diisi'
  if (!values.phone.trim()) errors.phone = 'No. HP wajib diisi'

  return errors
}
