import { createBrowserRouter } from 'react-router-dom'
import { IndexRedirect } from '@/app/index-redirect'
import { ProtectedRoute } from '@/app/protected-route'
import { RoleGuard } from '@/app/role-guard'
import { RootLayout } from '@/app/root-layout'
import { AppLayout } from '@/components/layout/app-layout'
import { ADMIN_ROLES, SUPER_ADMIN_ROLES } from '@/config/nav'
import { CustomersPage } from '@/pages/customers-page'
import { DashboardPage } from '@/pages/dashboard-page'
import { DesignSystemPage } from '@/pages/design-system-page'
import { ForbiddenPage } from '@/pages/forbidden-page'
import { LoginPage } from '@/pages/login-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { PlaceholderPage } from '@/pages/placeholder-page'
import { ProductsPage } from '@/pages/products-page'
import { SettingsPage } from '@/pages/settings-page'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/403', element: <ForbiddenPage /> },
      {
        path: '/',
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { index: true, element: <IndexRedirect /> },
              { path: 'design-system', element: <DesignSystemPage /> },
              { path: 'sell', element: <PlaceholderPage title="Penjualan" /> },
              { path: 'buyback', element: <PlaceholderPage title="Buyback" /> },
              { path: 'products', element: <ProductsPage /> },
              { path: 'customers', element: <CustomersPage /> },
              { path: 'customers/new', element: <PlaceholderPage title="Tambah Pelanggan" /> },
              {
                element: <RoleGuard roles={ADMIN_ROLES} />,
                children: [
                  { path: 'dashboard', element: <DashboardPage /> },
                  { path: 'suppliers', element: <PlaceholderPage title="Supplier" /> },
                  {
                    path: 'gold-prices',
                    element: <PlaceholderPage title="Harga Emas" blocked />,
                  },
                  {
                    path: 'purchase-orders',
                    element: <PlaceholderPage title="Purchase Order" />,
                  },
                  {
                    path: 'stock-opnames',
                    element: <PlaceholderPage title="Stock Opname" />,
                  },
                  { path: 'expenses', element: <PlaceholderPage title="Pengeluaran" /> },
                  {
                    path: 'reports/transactions',
                    element: <PlaceholderPage title="Laporan Transaksi" />,
                  },
                  {
                    path: 'reports/stock',
                    element: <PlaceholderPage title="Laporan Stok" />,
                  },
                  {
                    path: 'reports/finance',
                    element: <PlaceholderPage title="Laporan Keuangan" />,
                  },
                  { path: 'settings', element: <SettingsPage /> },
                ],
              },
              {
                element: <RoleGuard roles={SUPER_ADMIN_ROLES} />,
                children: [
                  { path: 'users', element: <PlaceholderPage title="Manajemen User" /> },
                ],
              },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
