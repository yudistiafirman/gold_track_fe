import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DataTable } from '@/components/data-table/data-table'
import type { DataTableColumn, PaginationMeta } from '@/components/data-table/types'
import { CreateExpenseDialog } from '@/components/expenses/create-expense-dialog'
import { DeleteExpenseDialog } from '@/components/expenses/delete-expense-dialog'
import { EditExpenseDialog } from '@/components/expenses/edit-expense-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useExpenseCategories } from '@/hooks/use-expense-categories'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import { formatCurrency, formatDate } from '@/lib/format'
import type { Expense } from '@/types/expense'

interface ExpenseListResponse {
  items: Expense[]
  pagination: PaginationMeta
}

const PAGE_SIZE = 10

export function ExpensesPage() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [categoryId, setCategoryId] = useState('ALL')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  const [deletingExpense, setDeletingExpense] = useState<{
    id: string
    description: string
    amount: number
  } | null>(null)

  const categoriesQuery = useExpenseCategories()

  const expensesQuery = useQuery({
    queryKey: ['expenses', { dateFrom, dateTo, categoryId, page }],
    queryFn: () =>
      api.get<ExpenseListResponse>('/expenses', {
        params: {
          category_id: categoryId === 'ALL' ? undefined : categoryId,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          page,
          limit: PAGE_SIZE,
        },
      }),
    placeholderData: keepPreviousData,
  })

  const columns = useMemo<DataTableColumn<Expense>[]>(
    () => [
      {
        id: 'expense_date',
        header: 'Tanggal',
        cell: (row) => formatDate(row.expense_date),
      },
      { id: 'category', header: 'Kategori', cell: (row) => row.category.name },
      { id: 'description', header: 'Deskripsi', cell: (row) => row.description },
      {
        id: 'amount',
        header: 'Jumlah',
        cell: (row) => formatCurrency(row.amount),
        className: 'text-table-num',
      },
      {
        id: 'actions',
        header: '',
        className: 'w-0',
        cell: (row) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Edit ${row.description}`}
              onClick={() => setEditingExpenseId(row.id)}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Hapus ${row.description}`}
              onClick={() =>
                setDeletingExpense({ id: row.id, description: row.description, amount: row.amount })
              }
            >
              <Trash2 className="text-error" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  const isError = expensesQuery.isError
  const emptyTitle = isError ? 'Gagal memuat pengeluaran' : 'Belum ada pengeluaran'
  const emptyDescription = isError
    ? expensesQuery.error instanceof ApiError
      ? expensesQuery.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : undefined

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          Tambah Pengeluaran
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={expensesQuery.data?.items ?? []}
        getRowId={(row) => row.id}
        isLoading={expensesQuery.isPending}
        pagination={expensesQuery.data?.pagination}
        onPageChange={setPage}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        filters={
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value)
                setPage(1)
              }}
              className="w-40"
              aria-label="Dari tanggal"
            />
            <span className="text-caption text-gray-500">s/d</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value)
                setPage(1)
              }}
              className="w-40"
              aria-label="Sampai tanggal"
            />
            <Select
              value={categoryId}
              onValueChange={(value) => {
                setCategoryId(value)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua kategori</SelectItem>
                {categoriesQuery.data?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <CreateExpenseDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditExpenseDialog expenseId={editingExpenseId} onClose={() => setEditingExpenseId(null)} />
      <DeleteExpenseDialog expense={deletingExpense} onClose={() => setDeletingExpense(null)} />
    </div>
  )
}
