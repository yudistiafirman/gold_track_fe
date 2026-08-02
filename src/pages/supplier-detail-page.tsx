import { useQuery } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { EditSupplierDialog } from '@/components/suppliers/edit-supplier-dialog'
import { SupplierTransactionHistory } from '@/components/suppliers/supplier-transaction-history'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api/client'
import { useCan } from '@/lib/permissions'
import { NotFoundPage } from '@/pages/not-found-page'
import type { Supplier } from '@/types/supplier'

export function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [editOpen, setEditOpen] = useState(false)
  const canUpdate = useCan('update', 'suppliers')

  const supplierQuery = useQuery({
    queryKey: ['suppliers', id],
    queryFn: () => api.get<Supplier>(`/suppliers/${id}`),
    enabled: id !== undefined,
    retry: false,
  })

  // Covers both 404 (not found) and 400 (invalid id format) — ApiError doesn't
  // carry the HTTP status, and both cases need the same graceful, non-crashing page.
  if (supplierQuery.isError) {
    return <NotFoundPage />
  }

  const supplier = supplierQuery.data

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        {supplierQuery.isPending || !supplier ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-h1 text-gray-900">{supplier.name}</h1>
            </div>
            <p className="text-caption text-gray-500">
              {[supplier.phone, supplier.address].filter(Boolean).join(' · ') ||
                'Tidak ada kontak'}
            </p>
            {supplier.notes && <p className="text-caption text-gray-500">{supplier.notes}</p>}
          </div>
        )}

        {canUpdate && supplier && (
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Pencil />
            Edit
          </Button>
        )}
      </div>

      {supplier && <SupplierTransactionHistory supplierId={supplier.id} />}

      <EditSupplierDialog
        supplierId={editOpen ? (id ?? null) : null}
        onClose={() => setEditOpen(false)}
      />
    </div>
  )
}
