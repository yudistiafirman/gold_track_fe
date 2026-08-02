import { Construction } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'

interface PlaceholderPageProps {
  title: string
  blocked?: boolean
}

export function PlaceholderPage({ title, blocked = false }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-gray-900">{title}</h1>
      <EmptyState
        icon={Construction}
        title={blocked ? 'Fitur belum tersedia' : 'Halaman sedang dibangun'}
        description={
          blocked
            ? 'Menunggu endpoint backend untuk modul ini.'
            : 'Modul ini belum diimplementasikan — placeholder dari FE-003.'
        }
      />
    </div>
  )
}
