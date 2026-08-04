import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  caption?: string
  tone?: 'default' | 'negative' | 'primary'
}

export function KpiCard({ label, value, icon: Icon, badge, caption, tone = 'default' }: KpiCardProps) {
  if (tone === 'primary') {
    return (
      <div className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br from-green-500 to-green-700 p-4 text-primary-foreground shadow-card transition-shadow hover:shadow-modal">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-white/10 blur-2xl"
        />
        <div className="relative flex items-start justify-between">
          <p className="text-label text-primary-foreground/80 uppercase">{label}</p>
          <div className="rounded-lg bg-white/15 p-2">
            <Icon className="size-5" />
          </div>
        </div>
        <p className="text-h1 relative tracking-tight tabular-nums">{value}</p>
        {caption && <p className="relative text-caption text-primary-foreground/80">{caption}</p>}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-modal">
      <div className="flex items-start justify-between">
        <p className="text-label text-gray-500 uppercase">{label}</p>
        <div className={cn('rounded-lg p-2', tone === 'negative' ? 'bg-error/10' : 'bg-primary/10')}>
          <Icon className={cn('size-5', tone === 'negative' ? 'text-error' : 'text-primary')} />
        </div>
      </div>
      <p className="text-h1 tracking-tight tabular-nums text-gray-900">{value}</p>
      {badge && (
        <span className="mt-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-caption font-medium text-green-700">
          {badge}
        </span>
      )}
      {caption && <p className="mt-1 text-caption text-gray-500">{caption}</p>}
    </div>
  )
}
