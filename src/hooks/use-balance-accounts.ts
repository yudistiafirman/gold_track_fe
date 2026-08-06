import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { BalanceAccount } from '@/types/balance-account'

export function useBalanceAccounts(enabled = true) {
  return useQuery({
    queryKey: ['balance-accounts'],
    queryFn: () => api.get<BalanceAccount[]>('/balance-accounts'),
    enabled,
  })
}
