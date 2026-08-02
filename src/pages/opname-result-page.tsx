import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DataTable } from '@/components/data-table/data-table'
import type { DataTableColumn, PaginationMeta } from '@/components/data-table/types'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api/client'
import {
  OPNAME_RESULT_TONE,
  OPNAME_SESSION_STATUS_TONE,
  type OpnameResult,
  PHYSICAL_STATUS_TONE,
  STOCK_STATUS_TONE,
  resolveStatusTone,
} from '@/lib/domain-status'
import { formatDate } from '@/lib/format'
import { NotFoundPage } from '@/pages/not-found-page'
import type { StockOpnameDetail, StockOpnameItem } from '@/types/stock-opname'

const PAGE_SIZE = 10

const RESULT_FILTERS: { value: OpnameResult | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Semua' },
  { value: 'MATCH', label: 'Match' },
  { value: 'MISSING', label: 'Missing' },
  { value: 'UNEXPECTED', label: 'Unexpected' },
]

export function OpnameResultPage() {
  const { id } = useParams<{ id: string }>()
  const [resultFilter, setResultFilter] = useState<OpnameResult | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const opnameQuery = useQuery({
    queryKey: ['stock-opnames', id],
    queryFn: () => api.get<StockOpnameDetail>(`/stock-opnames/${id}`),
    enabled: id !== undefined,
    retry: false,
  })

  const opname = opnameQuery.data

  const filteredItems = useMemo(() => {
    if (!opname) return []
    const lowerSearch = search.trim().toLowerCase()
    return opname.items.filter((item) => {
      if (resultFilter !== 'ALL' && item.result !== resultFilter) return false
      if (!lowerSearch) return true
      return (
        item.barcode.toLowerCase().includes(lowerSearch) ||
        item.product_name.toLowerCase().includes(lowerSearch)
      )
    })
  }, [opname, resultFilter, search])

  // Covers both 404 (not found) and 400 (invalid id) — ApiError doesn't carry
  // HTTP status, and both need the same graceful, non-crashing page.
  if (opnameQuery.isError) {
    return <NotFoundPage />
  }

  const isLoading = opnameQuery.isPending || !opname

  const pageItems = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const pagination: PaginationMeta = {
    page,
    limit: PAGE_SIZE,
    total: filteredItems.length,
    total_pages: Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE)),
  }

  const columns: DataTableColumn<StockOpnameItem>[] = [
    {
      id: 'barcode',
      header: 'Barcode',
      cell: (item) => item.barcode,
      className: 'text-table-num',
    },
    { id: 'product', header: 'Produk', cell: (item) => item.product_name },
    {
      id: 'system_status',
      header: 'Status Sistem',
      cell: (item) => (
        <StatusBadge tone={STOCK_STATUS_TONE[item.system_status]} label={item.system_status} />
      ),
    },
    {
      id: 'physical_status',
      header: 'Status Fisik',
      cell: (item) => (
        <StatusBadge tone={PHYSICAL_STATUS_TONE[item.physical_status]} label={item.physical_status} />
      ),
    },
    {
      id: 'result',
      header: 'Hasil',
      cell: (item) => <StatusBadge tone={OPNAME_RESULT_TONE[item.result]} label={item.result} />,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link to="/stock-opnames">
          <ArrowLeft />
          Kembali
        </Link>
      </Button>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : opname.status === 'IN_PROGRESS' ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-8 text-center shadow-card">
          <p className="text-body text-gray-700">
            Sesi {opname.opname_code} masih berjalan — selesaikan sesi untuk melihat ringkasan
            hasil.
          </p>
          <Button asChild>
            <Link to={`/stock-opnames/${opname.id}/scan`}>Lanjutkan Scan</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h1 className="text-h1 text-gray-900">{opname.opname_code}</h1>
                <StatusBadge
                  tone={resolveStatusTone(OPNAME_SESSION_STATUS_TONE, opname.status)}
                  label={opname.status}
                />
              </div>
              <p className="text-caption text-gray-500">{formatDate(opname.opname_date)}</p>
              {opname.notes && <p className="text-caption text-gray-500">Catatan: {opname.notes}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-card">
              <div>
                <p className="text-caption text-gray-500">Match</p>
                <p className="text-h2 tabular-nums text-success">
                  {opname.summary.match.toLocaleString('id-ID')}
                </p>
              </div>
              <CheckCircle2 className="size-6 text-success" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-card">
              <div>
                <p className="text-caption text-gray-500">Missing</p>
                <p className="text-h2 tabular-nums text-error">
                  {opname.summary.missing.toLocaleString('id-ID')}
                </p>
              </div>
              <XCircle className="size-6 text-error" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-card">
              <div>
                <p className="text-caption text-gray-500">Unexpected</p>
                <p className="text-h2 tabular-nums text-warning">
                  {opname.summary.unexpected.toLocaleString('id-ID')}
                </p>
              </div>
              <AlertTriangle className="size-6 text-warning" />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={pageItems}
            getRowId={(item) => item.id}
            pagination={pagination}
            onPageChange={setPage}
            search={search}
            onSearchChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
            searchPlaceholder="Cari barcode atau produk..."
            emptyTitle="Tidak ada item"
            filters={
              <div className="flex gap-1">
                {RESULT_FILTERS.map((filter) => (
                  <Button
                    key={filter.value}
                    type="button"
                    size="sm"
                    variant={resultFilter === filter.value ? 'default' : 'secondary'}
                    onClick={() => {
                      setResultFilter(filter.value)
                      setPage(1)
                    }}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            }
          />
        </>
      )}
    </div>
  )
}
