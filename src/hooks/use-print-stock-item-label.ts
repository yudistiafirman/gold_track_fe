import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { printStockItemLabel, printStockItemLabels } from '@/lib/print-stock-label'
import { showErrorToast } from '@/lib/toast'
import type { StockItemLabel } from '@/types/stock-item'

export function usePrintStockItemLabel() {
  return useMutation({
    mutationFn: (stockItemId: string) =>
      api.get<StockItemLabel>(`/stock-items/${stockItemId}/label`),
    onSuccess: (label) => {
      void printStockItemLabel(label)
    },
    onError: (error) => {
      showErrorToast(error, 'Gagal memuat data label.')
    },
  })
}

export function usePrintStockItemLabels() {
  return useMutation({
    mutationFn: (stockItemIds: string[]) =>
      Promise.all(
        stockItemIds.map((id) => api.get<StockItemLabel>(`/stock-items/${id}/label`)),
      ),
    onSuccess: (labels) => {
      void printStockItemLabels(labels)
    },
    onError: (error) => {
      showErrorToast(error, 'Gagal memuat data label untuk salah satu unit.')
    },
  })
}
