import { Receipt, Tags } from 'lucide-react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { PageTabs } from '@/components/page-tabs'

function activeTabFromPath(pathname: string): string {
  if (pathname.endsWith('/categories')) return 'categories'
  return 'expenses'
}

/** /expenses is tab-based (Pengeluaran / Kategori), same pattern as Produk/Kategori/Brand (FE-205). */
export function ExpensesLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  const activeTab = activeTabFromPath(location.pathname)

  function handleTabChange(value: string) {
    navigate(value === 'expenses' ? '/expenses' : `/expenses/${value}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-gray-900">Pengeluaran</h1>

      <PageTabs
        value={activeTab}
        onValueChange={handleTabChange}
        items={[
          { value: 'expenses', label: 'Pengeluaran', icon: Receipt },
          { value: 'categories', label: 'Kategori', icon: Tags },
        ]}
      />

      <Outlet />
    </div>
  )
}
