import {
  ClipboardCheck,
  ClipboardList,
  FileBarChart,
  LayoutDashboard,
  type LucideIcon,
  Package,
  Receipt,
  RefreshCw,
  ShoppingCart,
  Store,
  Truck,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react'
import { ROLES, type Role } from '@/types/role'

export const ALL_ROLES: Role[] = [...ROLES]
export const ADMIN_ROLES: Role[] = ['ADMIN', 'SUPER_ADMIN']
export const SUPER_ADMIN_ROLES: Role[] = ['SUPER_ADMIN']

export interface NavLink {
  type: 'link'
  title: string
  url: string
  icon: LucideIcon
  roles: Role[]
}

export interface NavGroup {
  type: 'group'
  title: string
  icon: LucideIcon
  roles: Role[]
  children: { title: string; url: string }[]
}

export type NavItem = NavLink | NavGroup

export interface NavSection {
  label: string
  items: NavItem[]
}

/** Main nav, rendered top-to-bottom in the sidebar body. */
export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Utama',
    items: [
      {
        type: 'link',
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutDashboard,
        roles: SUPER_ADMIN_ROLES,
      },
    ],
  },
  {
    label: 'Transaksi',
    items: [
      { type: 'link', title: 'Penjualan', url: '/sell', icon: ShoppingCart, roles: ALL_ROLES },
      { type: 'link', title: 'Buyback', url: '/buyback', icon: RefreshCw, roles: ALL_ROLES },
    ],
  },
  {
    label: 'Master Data',
    items: [
      { type: 'link', title: 'Produk', url: '/products', icon: Package, roles: ALL_ROLES },
      { type: 'link', title: 'Pelanggan', url: '/customers', icon: Users, roles: ALL_ROLES },
      { type: 'link', title: 'Supplier', url: '/suppliers', icon: Truck, roles: ADMIN_ROLES },
    ],
  },
  {
    label: 'Operasional',
    items: [
      {
        type: 'link',
        title: 'Purchase Order',
        url: '/purchase-orders',
        icon: ClipboardList,
        roles: ADMIN_ROLES,
      },
      {
        type: 'link',
        title: 'Stock Opname',
        url: '/stock-opnames',
        icon: ClipboardCheck,
        roles: ADMIN_ROLES,
      },
      {
        type: 'link',
        title: 'Pengeluaran',
        url: '/expenses',
        icon: Receipt,
        roles: ADMIN_ROLES,
      },
    ],
  },
  {
    label: 'Laporan',
    items: [
      {
        type: 'group',
        title: 'Laporan',
        icon: FileBarChart,
        roles: SUPER_ADMIN_ROLES,
        children: [
          { title: 'Transaksi', url: '/reports/transactions' },
          { title: 'Stok', url: '/reports/stock' },
          { title: 'Keuangan', url: '/reports/finance' },
        ],
      },
      {
        type: 'group',
        title: 'Kas',
        icon: Wallet,
        roles: SUPER_ADMIN_ROLES,
        children: [
          { title: 'Saldo Uang', url: '/balance-accounts' },
          { title: 'Uang Diluar', url: '/external-funds' },
          { title: 'Hutang Diluar', url: '/external-debts' },
        ],
      },
    ],
  },
]

/** Rendered separately (sidebar footer), pinned below the main nav. */
export const SETTINGS_NAV_SECTION: NavSection = {
  label: 'Pengaturan',
  items: [
    {
      type: 'link',
      title: 'Manajemen User',
      url: '/users',
      icon: UserCog,
      roles: SUPER_ADMIN_ROLES,
    },
    {
      type: 'link',
      title: 'Pengaturan Toko',
      url: '/settings',
      icon: Store,
      roles: ADMIN_ROLES,
    },
  ],
}

export function filterNavSections(sections: NavSection[], role: Role | null): NavSection[] {
  if (!role) return []
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0)
}
