import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { ExternalDebt } from '@/types/external-debt'

export function useExternalDebts(enabled = true) {
  return useQuery({
    queryKey: ['external-debts'],
    queryFn: () => api.get<ExternalDebt[]>('/external-debts'),
    enabled,
  })
}
