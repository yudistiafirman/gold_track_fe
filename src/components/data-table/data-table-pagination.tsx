import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PaginationMeta } from './types'

interface DataTablePaginationProps {
  pagination: PaginationMeta
  onPageChange: (page: number) => void
}

export function DataTablePagination({ pagination, onPageChange }: DataTablePaginationProps) {
  const { page, limit, total, total_pages } = pagination
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-caption text-gray-500">
        Menampilkan {from}–{to} dari {total}
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft />
          Sebelumnya
        </Button>
        <span className="px-2 text-caption text-gray-500">
          Hal {page} / {Math.max(total_pages, 1)}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={page >= total_pages}
          onClick={() => onPageChange(page + 1)}
        >
          Berikutnya
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
