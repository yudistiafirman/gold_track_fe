import { useMemo, useState } from 'react'
import { StatusBadge } from '@/components/status-badge'
import { DataTable } from '@/components/data-table/data-table'
import type { DataTableColumn } from '@/components/data-table/types'
import { STOCK_CONDITION_TONE } from '@/lib/domain-status'
import { paginateMock } from '@/lib/paginate-mock'

interface Product {
  id: string
  name: string
  sku: string
  category: string
  stock: number
  condition: keyof typeof STOCK_CONDITION_TONE
}

const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Cincin Emas 24K', sku: 'CIN-001', category: 'Cincin', stock: 12, condition: 'GOOD' },
  { id: '2', name: 'Kalung Emas 22K', sku: 'KAL-014', category: 'Kalung', stock: 3, condition: 'GOOD' },
  { id: '3', name: 'Gelang Emas 18K', sku: 'GEL-007', category: 'Gelang', stock: 0, condition: 'BAD' },
  { id: '4', name: 'Anting Emas 24K', sku: 'ANT-022', category: 'Anting', stock: 8, condition: 'GOOD' },
  { id: '5', name: 'Liontin Emas 22K', sku: 'LIO-009', category: 'Liontin', stock: 5, condition: 'GOOD' },
  { id: '6', name: 'Cincin Kawin 24K', sku: 'CIN-018', category: 'Cincin', stock: 2, condition: 'BAD' },
  { id: '7', name: 'Kalung Emas 18K', sku: 'KAL-031', category: 'Kalung', stock: 10, condition: 'GOOD' },
  { id: '8', name: 'Gelang Emas 24K', sku: 'GEL-012', category: 'Gelang', stock: 6, condition: 'GOOD' },
]

const columns: DataTableColumn<Product>[] = [
  { id: 'name', header: 'Nama Produk', cell: (row) => row.name },
  { id: 'sku', header: 'SKU', cell: (row) => row.sku, className: 'text-table-num' },
  { id: 'category', header: 'Kategori', cell: (row) => row.category },
  { id: 'stock', header: 'Stok', cell: (row) => row.stock, className: 'text-table-num' },
  {
    id: 'condition',
    header: 'Kondisi',
    cell: (row) => <StatusBadge tone={STOCK_CONDITION_TONE[row.condition]} label={row.condition} />,
  },
]

const PAGE_SIZE = 5

export function ProductsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(
    () =>
      MOCK_PRODUCTS.filter((product) =>
        product.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  )
  const { items, pagination } = paginateMock(filtered, page, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-gray-900">Produk</h1>
      <DataTable
        columns={columns}
        data={items}
        getRowId={(row) => row.id}
        pagination={pagination}
        onPageChange={setPage}
        search={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        searchPlaceholder="Cari produk..."
        emptyTitle="Produk tidak ditemukan"
      />
    </div>
  )
}
