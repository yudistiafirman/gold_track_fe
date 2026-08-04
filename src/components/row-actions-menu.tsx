import type { LucideIcon } from 'lucide-react'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export interface RowAction {
  label: string
  icon: LucideIcon
  onClick: () => void
  variant?: 'default' | 'destructive'
  disabled?: boolean
  /** e.g. "animate-spin" while an action's mutation is pending for this row. */
  iconClassName?: string
  /** Tooltip shown on hover — mainly useful to explain why an action is disabled. */
  title?: string
}

interface RowActionsMenuProps {
  actions: RowAction[]
  ariaLabel: string
}

/**
 * Collapses a table row's per-record actions (view/edit/delete, etc.) into
 * one kebab menu instead of a row of icon buttons. Not for single-action
 * rows like "remove from draft cart" (sell/buyback/PO line items) — those
 * stay a direct button since a menu would only add a click there.
 */
export function RowActionsMenu({ actions, ariaLabel }: RowActionsMenuProps) {
  if (actions.length === 0) return null

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={ariaLabel}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actions.map((action) => (
            <DropdownMenuItem
              key={action.label}
              variant={action.variant}
              disabled={action.disabled}
              title={action.title}
              onClick={action.onClick}
            >
              <action.icon className={cn(action.iconClassName)} />
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
