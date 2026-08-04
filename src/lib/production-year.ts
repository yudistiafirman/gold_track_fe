export const PRODUCTION_YEAR_MIN = 2000
export const PRODUCTION_YEAR_MAX = new Date().getFullYear() + 1

/** Empty is valid — production_year is optional everywhere it appears. */
export function validateProductionYear(value: string): string | undefined {
  if (!value.trim()) return undefined
  const year = Number(value)
  if (!Number.isInteger(year) || year < PRODUCTION_YEAR_MIN || year > PRODUCTION_YEAR_MAX) {
    return `Tahun produksi harus antara ${PRODUCTION_YEAR_MIN}-${PRODUCTION_YEAR_MAX}`
  }
  return undefined
}
