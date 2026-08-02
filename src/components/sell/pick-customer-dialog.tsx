import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { QuickCreateCustomerDialog } from '@/components/customers/quick-create-customer-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { api } from '@/lib/api/client'
import type { Customer } from '@/types/customer'

interface PartyRef {
  id: string
  name: string
}

interface PickCustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (customer: PartyRef) => void
}

export function PickCustomerDialog({ open, onOpenChange, onSelect }: PickCustomerDialogProps) {
  const [search, setSearch] = useState('')
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)
  const debouncedSearch = useDebouncedValue(search, 400)

  const customersQuery = useQuery({
    queryKey: ['customers', { search: debouncedSearch, page: 1 }],
    queryFn: () =>
      api.get<{ items: Customer[] }>('/customers', {
        params: { search: debouncedSearch || undefined, page: 1, limit: 10 },
      }),
    enabled: open,
    placeholderData: keepPreviousData,
  })

  function handleClose(next: boolean) {
    onOpenChange(next)
    if (!next) setSearch('')
  }

  function handleSelect(customer: Customer) {
    onSelect({ id: customer.id, name: customer.name })
    handleClose(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Pilih Pelanggan</DialogTitle>
          </DialogHeader>

          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama/HP..."
              className="pl-8"
            />
          </div>

          <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
            {customersQuery.isPending ? (
              <p className="py-4 text-center text-caption text-gray-500">Memuat...</p>
            ) : customersQuery.data?.items.length === 0 ? (
              <p className="py-4 text-center text-caption text-gray-500">Tidak ditemukan.</p>
            ) : (
              customersQuery.data?.items.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => handleSelect(customer)}
                  className="flex flex-col items-start rounded-sm px-3 py-2 text-left hover:bg-muted"
                >
                  <span className="text-body text-gray-900">{customer.name}</span>
                  {customer.phone && (
                    <span className="text-caption text-gray-500">{customer.phone}</span>
                  )}
                </button>
              ))
            )}
          </div>

          <Button type="button" variant="secondary" onClick={() => setQuickCreateOpen(true)}>
            <Plus />
            Tambah Pelanggan Baru
          </Button>
        </DialogContent>
      </Dialog>

      <QuickCreateCustomerDialog
        open={quickCreateOpen}
        onOpenChange={setQuickCreateOpen}
        onCreated={(customer) => {
          onSelect({ id: customer.id, name: customer.name })
          handleClose(false)
        }}
      />
    </>
  )
}
