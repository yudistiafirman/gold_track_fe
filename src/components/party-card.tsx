import { User, X } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { initials } from '@/lib/format'

interface PartyCardParty {
  id: string
  name: string
}

interface PartyCardProps {
  label: string
  party: PartyCardParty | null
  onPick: () => void
  onClear: () => void
  disabled: boolean
}

/** Selected-customer/supplier summary used in transaction forms (Sell, Buyback): shows a "pick" button when empty, or an avatar + name + clear button once selected. */
export function PartyCard({ label, party, onPick, onClear, disabled }: PartyCardProps) {
  if (!party) {
    return (
      <Button type="button" variant="secondary" onClick={onPick} disabled={disabled} className="w-full">
        <User />
        {label}
      </Button>
    )
  }

  return (
    <div className="flex items-center justify-between rounded-md border border-border p-3">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback>{initials(party.name)}</AvatarFallback>
        </Avatar>
        <p className="text-body font-medium text-gray-900">{party.name}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Ganti"
        onClick={onClear}
        disabled={disabled}
      >
        <X />
      </Button>
    </div>
  )
}
