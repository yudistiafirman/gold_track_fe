export interface ExternalDebtFormValues {
  debtor_name: string
  amount: string
}

export interface ExternalDebtFormErrors {
  debtor_name?: string
  amount?: string
}

export function validateExternalDebtForm(
  values: ExternalDebtFormValues,
): ExternalDebtFormErrors {
  const errors: ExternalDebtFormErrors = {}

  if (!values.debtor_name.trim()) errors.debtor_name = 'Nama peminjam wajib diisi'

  const amount = Number(values.amount)
  if (!values.amount.trim()) {
    errors.amount = 'Nominal wajib diisi'
  } else if (Number.isNaN(amount) || amount <= 0) {
    errors.amount = 'Nominal harus lebih besar dari 0'
  }

  return errors
}
