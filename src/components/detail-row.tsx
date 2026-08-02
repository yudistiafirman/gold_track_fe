import type { ReactNode } from 'react'

interface DetailRowProps {
  label: string
  value: ReactNode
}

export function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-2 last:border-0">
      <span className="text-caption text-gray-500">{label}</span>
      <span className="text-body text-gray-900">{value}</span>
    </div>
  )
}
