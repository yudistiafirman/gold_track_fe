import { Award, Package, Tags } from 'lucide-react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { PageTabs } from '@/components/page-tabs'
import { ADMIN_ROLES } from '@/config/nav'
import { useCurrentRole } from '@/store/auth-store'

function activeTabFromPath(pathname: string): string {
  if (pathname.endsWith('/categories')) return 'categories'
  if (pathname.endsWith('/brands')) return 'brands'
  return 'products'
}

/**
 * FE-205: /products is now tab-based (Produk / Kategori / Brand). Tab
 * switches are plain client-side navigation (React Router already avoids a
 * full reload), each tab deep-links to its own route, and the tab bar
 * itself lives here so it doesn't remount when switching tabs.
 */
export function ProductsLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const role = useCurrentRole()
  const canManageCatalog = role !== null && ADMIN_ROLES.includes(role)

  const activeTab = activeTabFromPath(location.pathname)

  function handleTabChange(value: string) {
    navigate(value === 'products' ? '/products' : `/products/${value}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h1 text-gray-900">Produk</h1>
        <p className="text-caption text-gray-500">Kelola katalog produk, kategori, dan brand.</p>
      </div>

      <PageTabs
        value={activeTab}
        onValueChange={handleTabChange}
        items={[
          { value: 'products', label: 'Produk', icon: Package },
          ...(canManageCatalog
            ? [
                { value: 'categories', label: 'Kategori', icon: Tags },
                { value: 'brands', label: 'Brand', icon: Award },
              ]
            : []),
        ]}
      />

      <Outlet />
    </div>
  )
}
