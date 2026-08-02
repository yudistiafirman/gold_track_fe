import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { StockItemsTab } from '@/components/products/stock-items-tab'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import type { Product } from '@/types/product'

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()

  const productQuery = useQuery({
    queryKey: ['products', id],
    queryFn: () => api.get<Product>(`/products/${id}`),
    enabled: id !== undefined,
    retry: false,
  })

  if (productQuery.isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (productQuery.isError || !productQuery.data) {
    const message =
      productQuery.error instanceof ApiError
        ? productQuery.error.message
        : 'Produk tidak ditemukan.'
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-body text-gray-500">{message}</p>
        <Button asChild variant="secondary">
          <Link to="/products">Kembali ke daftar produk</Link>
        </Button>
      </div>
    )
  }

  const product = productQuery.data

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link to="/products">
            <ArrowLeft />
            Kembali ke Produk
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-h1 text-gray-900">{product.name}</h1>
        </div>
        <p className="text-caption text-gray-500">SKU {product.sku}</p>
      </div>

      <StockItemsTab productId={product.id} />
    </div>
  )
}
