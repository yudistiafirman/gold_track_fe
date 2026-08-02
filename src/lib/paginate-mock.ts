import type { PaginationMeta } from '@/components/data-table/types'

/**
 * Client-side slicing that mimics the `{items, pagination}` envelope most
 * list endpoints return. Demo/example pages use this so swapping in a real
 * `useQuery` later is a drop-in — same shape, no DataTable changes needed.
 */
export function paginateMock<T>(
  items: T[],
  page: number,
  limit: number,
): { items: T[]; pagination: PaginationMeta } {
  const total = items.length
  const total_pages = Math.max(Math.ceil(total / limit), 1)
  const start = (page - 1) * limit

  return {
    items: items.slice(start, start + limit),
    pagination: { page, limit, total, total_pages },
  }
}
