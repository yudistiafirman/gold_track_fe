import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { ExpenseCategory } from '@/types/expense-category'

/** Plain array, not paginated (FE-1201) — shared so the expense form's dropdown (FE-1202 AC3) and the category manager both invalidate the same query key and stay in sync. */
export function useExpenseCategories(enabled = true) {
  return useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => api.get<ExpenseCategory[]>('/expense-categories'),
    enabled,
  })
}
