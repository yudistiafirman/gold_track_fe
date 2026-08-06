export interface BalanceAccountFormValues {
  name: string
  balance: string
}

export interface BalanceAccountFormErrors {
  name?: string
  balance?: string
}

export function validateBalanceAccountForm(
  values: BalanceAccountFormValues,
): BalanceAccountFormErrors {
  const errors: BalanceAccountFormErrors = {}

  if (!values.name.trim()) errors.name = 'Nama wajib diisi'

  const balance = Number(values.balance)
  if (!values.balance.trim()) {
    errors.balance = 'Saldo wajib diisi'
  } else if (Number.isNaN(balance) || balance < 0) {
    errors.balance = 'Saldo tidak boleh negatif'
  }

  return errors
}
