import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { CustomerTransactionHistory } from '@/components/customers/customer-transaction-history'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import type { Customer } from '@/types/customer'

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()

  const customerQuery = useQuery({
    queryKey: ['customers', id],
    queryFn: () => api.get<Customer>(`/customers/${id}`),
    enabled: id !== undefined,
    retry: false,
  })

  if (customerQuery.isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (customerQuery.isError || !customerQuery.data) {
    const message =
      customerQuery.error instanceof ApiError
        ? customerQuery.error.message
        : 'Pelanggan tidak ditemukan.'
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-body text-gray-500">{message}</p>
        <Button asChild variant="secondary">
          <Link to="/customers">Kembali ke daftar pelanggan</Link>
        </Button>
      </div>
    )
  }

  const customer = customerQuery.data

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link to="/customers">
            <ArrowLeft />
            Kembali ke Pelanggan
          </Link>
        </Button>
        <h1 className="text-h1 text-gray-900">{customer.name}</h1>
        <p className="text-caption text-gray-500">
          {[customer.phone, customer.email].filter(Boolean).join(' · ') || 'Tidak ada kontak'}
        </p>
      </div>

      <CustomerTransactionHistory customerId={customer.id} />
    </div>
  )
}
