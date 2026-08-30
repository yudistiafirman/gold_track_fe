import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { ReconciliationReport } from '@/types/reconciliation-report'

/** Live saldo vs. the most recent daily closing. No params — the endpoint always
 *  compares "now" against the last recorded closing. */
export function useReconciliationReport() {
  return useQuery({
    queryKey: ['reports', 'reconciliation'],
    queryFn: () => api.get<ReconciliationReport>('/reports/reconciliation'),
  })
}
