import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { QuickCreateSupplierDialog } from '@/components/suppliers/quick-create-supplier-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { api } from '@/lib/api/client'
import type { Supplier } from '@/types/supplier'

interface PartyRef {
  id: string
  name: string
}

interface PickSupplierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (supplier: PartyRef) => void
}

export function PickSupplierDialog({ open, onOpenChange, onSelect }: PickSupplierDialogProps) {
  const [search, setSearch] = useState('')
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)
  const debouncedSearch = useDebouncedValue(search, 400)

  const suppliersQuery = useQuery({
    queryKey: ['suppliers', { search: debouncedSearch, page: 1 }],
    queryFn: () =>
      api.get<{ items: Supplier[] }>('/suppliers', {
        params: { search: debouncedSearch || undefined, page: 1, limit: 10 },
      }),
    enabled: open,
    placeholderData: keepPreviousData,
  })

  function handleClose(next: boolean) {
    onOpenChange(next)
    if (!next) setSearch('')
  }

  function handleSelect(supplier: Supplier) {
    onSelect({ id: supplier.id, name: supplier.name })
    handleClose(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Pilih Supplier</DialogTitle>
          </DialogHeader>

          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari supplier..."
              className="pl-8"
            />
          </div>

          <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
            {suppliersQuery.isPending ? (
              <p className="py-4 text-center text-caption text-gray-500">Memuat...</p>
            ) : suppliersQuery.data?.items.length === 0 ? (
              <p className="py-4 text-center text-caption text-gray-500">Tidak ditemukan.</p>
            ) : (
              suppliersQuery.data?.items.map((supplier) => (
                <button
                  key={supplier.id}
                  type="button"
                  onClick={() => handleSelect(supplier)}
                  className="flex flex-col items-start rounded-sm px-3 py-2 text-left hover:bg-muted"
                >
                  <span className="text-body text-gray-900">{supplier.name}</span>
                  {supplier.phone && (
                    <span className="text-caption text-gray-500">{supplier.phone}</span>
                  )}
                </button>
              ))
            )}
          </div>

          <Button type="button" variant="secondary" onClick={() => setQuickCreateOpen(true)}>
            <Plus />
            Tambah Supplier Baru
          </Button>
        </DialogContent>
      </Dialog>

      <QuickCreateSupplierDialog
        open={quickCreateOpen}
        onOpenChange={setQuickCreateOpen}
        onCreated={(supplier) => {
          onSelect({ id: supplier.id, name: supplier.name })
          handleClose(false)
        }}
      />
    </>
  )
}
