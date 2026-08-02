import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { api } from '@/lib/api/client'
import type { Product } from '@/types/product'

interface PickProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (product: Product) => void
}

export function PickProductDialog({ open, onOpenChange, onSelect }: PickProductDialogProps) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 400)

  const productsQuery = useQuery({
    queryKey: ['products', { search: debouncedSearch, page: 1 }],
    queryFn: () =>
      api.get<{ items: Product[] }>('/products', {
        params: { search: debouncedSearch || undefined, page: 1, limit: 10 },
      }),
    enabled: open,
    placeholderData: keepPreviousData,
  })

  function handleClose(next: boolean) {
    onOpenChange(next)
    if (!next) setSearch('')
  }

  function handleSelect(product: Product) {
    onSelect(product)
    handleClose(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Pilih Produk</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama/SKU produk..."
            className="pl-8"
          />
        </div>

        <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
          {productsQuery.isPending ? (
            <p className="py-4 text-center text-caption text-gray-500">Memuat...</p>
          ) : productsQuery.data?.items.length === 0 ? (
            <p className="py-4 text-center text-caption text-gray-500">Tidak ditemukan.</p>
          ) : (
            productsQuery.data?.items.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => handleSelect(product)}
                className="flex flex-col items-start rounded-sm px-3 py-2 text-left hover:bg-muted"
              >
                <span className="text-body text-gray-900">{product.name}</span>
                <span className="text-caption text-gray-500">
                  {product.sku} · {product.weight_gram} gr
                </span>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
