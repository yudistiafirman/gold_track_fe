export interface ExternalFundFormValues {
  description: string
  amount: string
}

export interface ExternalFundFormErrors {
  description?: string
  amount?: string
}

export function validateExternalFundForm(
  values: ExternalFundFormValues,
): ExternalFundFormErrors {
  const errors: ExternalFundFormErrors = {}

  if (!values.description.trim()) errors.description = 'Keterangan wajib diisi'

  const amount = Number(values.amount)
  if (!values.amount.trim()) {
    errors.amount = 'Nominal wajib diisi'
  } else if (Number.isNaN(amount) || amount <= 0) {
    errors.amount = 'Nominal harus lebih besar dari 0'
  }

  return errors
}
