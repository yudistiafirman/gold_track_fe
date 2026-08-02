const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return dateFormatter.format(new Date(value))
}

/** Formats a raw-digit string with `.` thousand separators for display in a price input. */
export function formatThousands(digits: string): string {
  if (!digits) return ''
  return Number(digits).toLocaleString('id-ID')
}

export function todayDateInputValue(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
