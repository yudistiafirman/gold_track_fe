import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { LookupItem } from '@/types/lookup'

export function useProductLookups(enabled: boolean) {
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<LookupItem[]>('/categories'),
    enabled,
  })
  const brandsQuery = useQuery({
    queryKey: ['brands'],
    queryFn: () => api.get<LookupItem[]>('/brands'),
    enabled,
  })

  return {
    categories: (categoriesQuery.data ?? []).filter((item) => item.is_active),
    brands: (brandsQuery.data ?? []).filter((item) => item.is_active),
    isLoading: categoriesQuery.isPending || brandsQuery.isPending,
  }
}
