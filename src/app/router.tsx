import { createBrowserRouter } from 'react-router-dom'
import { IndexRedirect } from '@/app/index-redirect'
import { ProtectedRoute } from '@/app/protected-route'
import { RoleGuard } from '@/app/role-guard'
import { RootLayout } from '@/app/root-layout'
import { AppLayout } from '@/components/layout/app-layout'
import { ADMIN_ROLES, SUPER_ADMIN_ROLES } from '@/config/nav'
import { BuybackPage } from '@/pages/buyback-page'
import { CreatePurchaseOrderPage } from '@/pages/create-purchase-order-page'
import { CustomerDetailPage } from '@/pages/customer-detail-page'
import { CustomersPage } from '@/pages/customers-page'
import { DashboardPage } from '@/pages/dashboard-page'
import { DesignSystemPage } from '@/pages/design-system-page'
import { ExpensesPage } from '@/pages/expenses-page'
import { ForbiddenPage } from '@/pages/forbidden-page'
import { LoginPage } from '@/pages/login-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { OpnameResultPage } from '@/pages/opname-result-page'
import { PlaceholderPage } from '@/pages/placeholder-page'
import { ProductDetailPage } from '@/pages/product-detail-page'
import { ProductsPage } from '@/pages/products-page'
import { PurchaseOrderDetailPage } from '@/pages/purchase-order-detail-page'
import { PurchaseOrdersPage } from '@/pages/purchase-orders-page'
import { ReceivePurchaseOrderPage } from '@/pages/receive-purchase-order-page'
import { ScanOpnamePage } from '@/pages/scan-opname-page'
import { SellPage } from '@/pages/sell-page'
import { SettingsPage } from '@/pages/settings-page'
import { StartOpnamePage } from '@/pages/start-opname-page'
import { SupplierDetailPage } from '@/pages/supplier-detail-page'
import { SuppliersPage } from '@/pages/suppliers-page'
import { TransactionReceiptPage } from '@/pages/transaction-receipt-page'
import { TransactionsReportPage } from '@/pages/transactions-report-page'
import { UsersPage } from '@/pages/users-page'

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
              { path: 'sell', element: <SellPage /> },
              { path: 'buyback', element: <BuybackPage /> },
              { path: 'products', element: <ProductsPage /> },
              { path: 'products/:id', element: <ProductDetailPage /> },
              { path: 'customers', element: <CustomersPage /> },
              { path: 'customers/:id', element: <CustomerDetailPage /> },
              { path: 'transactions/:id', element: <TransactionReceiptPage /> },
              {
                element: <RoleGuard roles={ADMIN_ROLES} />,
                children: [
                  { path: 'dashboard', element: <DashboardPage /> },
                  { path: 'suppliers', element: <SuppliersPage /> },
                  { path: 'suppliers/:id', element: <SupplierDetailPage /> },
                  {
                    path: 'gold-prices',
                    element: <PlaceholderPage title="Harga Emas" blocked />,
                  },
                  { path: 'purchase-orders', element: <PurchaseOrdersPage /> },
                  { path: 'purchase-orders/new', element: <CreatePurchaseOrderPage /> },
                  { path: 'purchase-orders/:id', element: <PurchaseOrderDetailPage /> },
                  {
                    path: 'purchase-orders/:id/receive',
                    element: <ReceivePurchaseOrderPage />,
                  },
                  { path: 'stock-opnames', element: <StartOpnamePage /> },
                  { path: 'stock-opnames/:id/scan', element: <ScanOpnamePage /> },
                  { path: 'stock-opnames/:id', element: <OpnameResultPage /> },
                  { path: 'expenses', element: <ExpensesPage /> },
                  { path: 'reports/transactions', element: <TransactionsReportPage /> },
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
                  { path: 'users', element: <UsersPage /> },
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
