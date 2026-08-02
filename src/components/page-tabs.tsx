import type { LucideIcon } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export interface PageTabItem {
  value: string
  label: string
  icon: LucideIcon
}

interface PageTabsProps {
  items: PageTabItem[]
  value: string
  onValueChange: (value: string) => void
}

const TRIGGER_CLASSES =
  'h-auto flex-none grow-0 items-center gap-2 px-1 pb-3 text-body font-medium text-gray-500 after:h-0.5 after:bg-primary hover:text-gray-900 data-active:text-primary'

/** Underline-style page-level tab strip (icon + label, brand-green active indicator) — shared by any page split into sub-sections via routes (e.g. Produk/Kategori/Brand, Pengeluaran/Kategori). */
export function PageTabs({ items, value, onValueChange }: PageTabsProps) {
  return (
    <Tabs value={value} onValueChange={onValueChange} className="gap-0">
      <TabsList
        variant="line"
        className="h-auto w-full justify-start gap-6 border-b border-border bg-transparent p-0"
      >
        {items.map((item) => (
          <TabsTrigger key={item.value} value={item.value} className={TRIGGER_CLASSES}>
            <item.icon className="size-4" />
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
