import { useQuery } from '@tanstack/react-query'
import { Coins } from 'lucide-react'
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
    return <Skeleton className="h-6 w-48 rounded-full" />
  }

  const price = goldPriceQuery.data
  if (!price) return null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-caption text-accent-foreground">
          <Coins className="size-3.5" />
          <span>Beli {formatCurrency(price.price_buy)}</span>
          <span className="text-gray-400">·</span>
          <span>Jual {formatCurrency(price.price_sell)}</span>
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
