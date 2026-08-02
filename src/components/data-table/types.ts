import type { ReactNode } from 'react'

/**
 * Matches the `pagination` block returned by most GoldTrack list
 * endpoints: `{items:[...], pagination:{page,limit,total,total_pages}}`.
 * Endpoints that return a plain array (e.g. GET /api/expense-categories)
 * don't have this — pass `pagination` as undefined for those callers.
 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface DataTableColumn<T> {
  id: string
  header: string
  cell: (row: T) => ReactNode
  className?: string
}
