import { createBrowserRouter } from 'react-router-dom'
import { IndexRedirect } from '@/app/index-redirect'
import { ProtectedRoute } from '@/app/protected-route'
import { RoleGuard } from '@/app/role-guard'
import { RootLayout } from '@/app/root-layout'
import { AppLayout } from '@/components/layout/app-layout'
import { ADMIN_ROLES, SUPER_ADMIN_ROLES } from '@/config/nav'
import { BalanceAccountsPage } from '@/pages/balance-accounts-page'
import { BuybackHistoryPage } from '@/pages/buyback-history-page'
import { BuybackPage } from '@/pages/buyback-page'
import { CreatePurchaseOrderPage } from '@/pages/create-purchase-order-page'
import { CustomerDetailPage } from '@/pages/customer-detail-page'
import { CustomersPage } from '@/pages/customers-page'
import { DashboardPage } from '@/pages/dashboard-page'
import { DesignSystemPage } from '@/pages/design-system-page'
import { ExpenseCategoriesPage } from '@/pages/expense-categories-page'
import { ExpensesLayout } from '@/pages/expenses-layout'
import { ExpensesPage } from '@/pages/expenses-page'
import { ExternalDebtsPage } from '@/pages/external-debts-page'
import { ExternalFundsPage } from '@/pages/external-funds-page'
import { FinanceReportPage } from '@/pages/finance-report-page'
import { ForbiddenPage } from '@/pages/forbidden-page'
import { LoginPage } from '@/pages/login-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { OpnameResultPage } from '@/pages/opname-result-page'
import { ProductBrandsPage } from '@/pages/product-brands-page'
import { ProductCategoriesPage } from '@/pages/product-categories-page'
import { ProductDetailPage } from '@/pages/product-detail-page'
import { ProductsLayout } from '@/pages/products-layout'
import { ProductsPage } from '@/pages/products-page'
import { PurchaseOrderDetailPage } from '@/pages/purchase-order-detail-page'
import { PurchaseOrdersPage } from '@/pages/purchase-orders-page'
import { ReceivePurchaseOrderPage } from '@/pages/receive-purchase-order-page'
import { SalesHistoryPage } from '@/pages/sales-history-page'
import { ScanOpnamePage } from '@/pages/scan-opname-page'
import { SellPage } from '@/pages/sell-page'
import { SettingsPage } from '@/pages/settings-page'
import { StartOpnamePage } from '@/pages/start-opname-page'
import { StockOpnamesPage } from '@/pages/stock-opnames-page'
import { StockReportPage } from '@/pages/stock-report-page'
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
              { path: 'sell/history', element: <SalesHistoryPage /> },
              { path: 'buyback', element: <BuybackPage /> },
              { path: 'buyback/history', element: <BuybackHistoryPage /> },
              {
                path: 'products',
                element: <ProductsLayout />,
                children: [
                  { index: true, element: <ProductsPage /> },
                  {
                    element: <RoleGuard roles={ADMIN_ROLES} />,
                    children: [
                      { path: 'categories', element: <ProductCategoriesPage /> },
                      { path: 'brands', element: <ProductBrandsPage /> },
                    ],
                  },
                ],
              },
              { path: 'products/:id', element: <ProductDetailPage /> },
              { path: 'customers', element: <CustomersPage /> },
              { path: 'customers/:id', element: <CustomerDetailPage /> },
              { path: 'transactions/:id', element: <TransactionReceiptPage /> },
              {
                element: <RoleGuard roles={ADMIN_ROLES} />,
                children: [
                  { path: 'suppliers', element: <SuppliersPage /> },
                  { path: 'suppliers/:id', element: <SupplierDetailPage /> },
                  { path: 'purchase-orders', element: <PurchaseOrdersPage /> },
                  { path: 'purchase-orders/new', element: <CreatePurchaseOrderPage /> },
                  { path: 'purchase-orders/:id', element: <PurchaseOrderDetailPage /> },
                  {
                    path: 'purchase-orders/:id/receive',
                    element: <ReceivePurchaseOrderPage />,
                  },
                  { path: 'stock-opnames', element: <StockOpnamesPage /> },
                  { path: 'stock-opnames/new', element: <StartOpnamePage /> },
                  { path: 'stock-opnames/:id/scan', element: <ScanOpnamePage /> },
                  { path: 'stock-opnames/:id', element: <OpnameResultPage /> },
                  {
                    path: 'expenses',
                    element: <ExpensesLayout />,
                    children: [
                      { index: true, element: <ExpensesPage /> },
                      { path: 'categories', element: <ExpenseCategoriesPage /> },
                    ],
                  },
                  { path: 'settings', element: <SettingsPage /> },
                ],
              },
              {
                element: <RoleGuard roles={SUPER_ADMIN_ROLES} />,
                children: [
                  { path: 'dashboard', element: <DashboardPage /> },
                  { path: 'reports/transactions', element: <TransactionsReportPage /> },
                  { path: 'reports/stock', element: <StockReportPage /> },
                  { path: 'reports/finance', element: <FinanceReportPage /> },
                  { path: 'users', element: <UsersPage /> },
                  { path: 'balance-accounts', element: <BalanceAccountsPage /> },
                  { path: 'external-funds', element: <ExternalFundsPage /> },
                  { path: 'external-debts', element: <ExternalDebtsPage /> },
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
