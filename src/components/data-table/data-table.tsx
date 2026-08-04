import { Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { EmptyState } from '@/components/empty-state'
import { TableSkeletonRows } from '@/components/table-skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination } from './data-table-pagination'
import type { DataTableColumn, PaginationMeta } from './types'

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  getRowId: (row: T) => string
  isLoading?: boolean
  pagination?: PaginationMeta
  onPageChange?: (page: number) => void
  search?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  filters?: ReactNode
  emptyTitle?: string
  emptyDescription?: string
  /** Opt-in row selection — pass both to render a checkbox column. */
  selectedIds?: Set<string>
  onSelectedIdsChange?: (ids: Set<string>) => void
}

export function DataTable<T>({
  columns,
  data,
  getRowId,
  isLoading = false,
  pagination,
  onPageChange,
  search,
  onSearchChange,
  searchPlaceholder = 'Cari...',
  filters,
  emptyTitle = 'Tidak ada data',
  emptyDescription,
  selectedIds,
  onSelectedIdsChange,
}: DataTableProps<T>) {
  const showToolbar = onSearchChange !== undefined || filters !== undefined
  const selectable = selectedIds !== undefined && onSelectedIdsChange !== undefined

  const visibleIds = data.map(getRowId)
  const selectedVisibleCount = selectable
    ? visibleIds.filter((id) => selectedIds.has(id)).length
    : 0
  const allVisibleSelected = selectable && visibleIds.length > 0 && selectedVisibleCount === visibleIds.length
  const someVisibleSelected = selectable && selectedVisibleCount > 0 && !allVisibleSelected

  function toggleAllVisible() {
    if (!selectable) return
    const next = new Set(selectedIds)
    if (allVisibleSelected) {
      for (const id of visibleIds) next.delete(id)
    } else {
      for (const id of visibleIds) next.add(id)
    }
    onSelectedIdsChange(next)
  }

  function toggleRow(id: string) {
    if (!selectable) return
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    onSelectedIdsChange(next)
  }

  return (
    <div className="flex flex-col gap-4">
      {showToolbar && (
        <div className="flex flex-wrap items-center gap-3">
          {onSearchChange && (
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search ?? ''}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={searchPlaceholder}
                className="pl-8"
              />
            </div>
          )}
          {filters}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-0">
                  <Checkbox
                    checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false}
                    onCheckedChange={toggleAllVisible}
                    disabled={visibleIds.length === 0}
                    aria-label="Pilih semua baris"
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead key={column.id} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeletonRows columns={columns.length + (selectable ? 1 : 0)} />
            ) : data.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length + (selectable ? 1 : 0)}>
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => {
                const id = getRowId(row)
                return (
                  <TableRow key={id} data-state={selectable && selectedIds.has(id) ? 'selected' : undefined}>
                    {selectable && (
                      <TableCell className="w-0">
                        <Checkbox
                          checked={selectedIds.has(id)}
                          onCheckedChange={() => toggleRow(id)}
                          aria-label="Pilih baris"
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell key={column.id} className={column.className}>
                        {column.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && onPageChange && (
        <DataTablePagination pagination={pagination} onPageChange={onPageChange} />
      )}
    </div>
  )
}
