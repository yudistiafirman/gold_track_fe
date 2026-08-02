export interface CustomerFormValues {
  name: string
  phone: string
  email: string
  id_type: string
  id_number: string
  address: string
  notes: string
}

export interface CustomerFormErrors {
  name?: string
  phone?: string
}

export function validateCustomerForm(values: CustomerFormValues): CustomerFormErrors {
  const errors: CustomerFormErrors = {}

  if (!values.name.trim()) errors.name = 'Nama pelanggan wajib diisi'
  if (!values.phone.trim()) errors.phone = 'No. HP wajib diisi'

  return errors
}
