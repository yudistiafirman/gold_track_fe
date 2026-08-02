import { Badge } from '@/components/ui/badge'
import type { StatusTone } from '@/lib/domain-status'
import { cn } from '@/lib/utils'

const toneClasses: Record<StatusTone, string> = {
  success: 'bg-green-100 text-green-700',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  gray: 'bg-gray-100 text-gray-700',
}

interface StatusBadgeProps {
  tone: StatusTone
  label: string
  className?: string
}

export function StatusBadge({ tone, label, className }: StatusBadgeProps) {
  return <Badge className={cn(toneClasses[tone], className)}>{label}</Badge>
}
