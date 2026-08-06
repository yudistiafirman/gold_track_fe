import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { ExternalFund } from '@/types/external-fund'

export function useExternalFunds(enabled = true) {
  return useQuery({
    queryKey: ['external-funds'],
    queryFn: () => api.get<ExternalFund[]>('/external-funds'),
    enabled,
  })
}
