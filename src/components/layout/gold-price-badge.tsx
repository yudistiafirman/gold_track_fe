import { useQuery } from '@tanstack/react-query'
import { Coins } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { api } from '@/lib/api/client'
import { formatCurrency, formatDateTime } from '@/lib/format'
import type { GoldPrice } from '@/types/gold-price'

const REFETCH_INTERVAL = 5 * 60 * 1000

/**
 * Pure reference display (BE-404) — never blocks or errors loudly. A stale
 * or missing sync just hides the badge instead of showing a broken state,
 * since this is decorative and not tied to any transaction pricing.
 */
export function GoldPriceBadge() {
  const goldPriceQuery = useQuery({
    queryKey: ['gold-price', 'active'],
    queryFn: () => api.get<GoldPrice | null>('/gold-prices/active'),
    staleTime: REFETCH_INTERVAL,
    refetchInterval: REFETCH_INTERVAL,
    retry: 1,
  })

  if (goldPriceQuery.isPending) {
    return <Skeleton className="h-8 w-64 rounded-full" />
  }

  const price = goldPriceQuery.data
  if (!price) return null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex cursor-help items-center gap-3 rounded-full border border-border bg-gray-50 py-1 pr-4 pl-1.5 transition-colors hover:bg-gray-100">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
            <Coins className="size-3.5" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-caption text-gray-500">Beli</span>
            <span className="text-label tabular-nums text-gray-900">
              {formatCurrency(price.price_buy)}
            </span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1.5">
            <span className="text-caption text-gray-500">Jual</span>
            <span className="text-label tabular-nums text-gray-900">
              {formatCurrency(price.price_sell)}
            </span>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        Referensi harga emas (per gram) · {price.source}
        <br />
        Diperbarui {formatDateTime(price.fetched_at)}
      </TooltipContent>
    </Tooltip>
  )
}
