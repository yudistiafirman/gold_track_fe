export interface ExpenseFormValues {
  category_id: string
  amount: string
  description: string
  expense_date: string
}

export interface ExpenseFormErrors {
  category_id?: string
  amount?: string
  description?: string
  expense_date?: string
}

export function validateExpenseForm(values: ExpenseFormValues): ExpenseFormErrors {
  const errors: ExpenseFormErrors = {}

  if (!values.category_id) errors.category_id = 'Kategori wajib dipilih'

  const amount = Number(values.amount)
  if (!values.amount.trim()) {
    errors.amount = 'Jumlah wajib diisi'
  } else if (Number.isNaN(amount) || amount <= 0) {
    errors.amount = 'Jumlah harus berupa angka lebih dari 0'
  }

  if (!values.description.trim()) errors.description = 'Deskripsi wajib diisi'
  if (!values.expense_date) errors.expense_date = 'Tanggal wajib diisi'

  return errors
}
