import { useMutation } from '@tanstack/react-query'
import { Loader2, ScanBarcode } from 'lucide-react'
import { type SubmitEvent, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import type { StockItemLookupResult } from '@/types/stock-item-lookup'

interface BarcodeScanInputProps {
  /** Forwarded as-is to the lookup's `type` param — same value as the transaction being built. */
  type: 'SELL' | 'SELL_SUPPLIER' | 'BUY'
  onFound: (item: StockItemLookupResult) => void
}

/**
 * Scanner-as-keyboard friendly: a barcode scanner types the code then sends
 * Enter, which submits the form naturally — no keystroke debouncing needed.
 * Refocuses after every attempt (success or failure) so a cashier can keep
 * scanning back-to-back without touching the mouse.
 */
export function BarcodeScanInput({ type, onFound }: BarcodeScanInputProps) {
  const [barcode, setBarcode] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const lookupMutation = useMutation({
    mutationFn: (code: string) =>
      api.get<StockItemLookupResult>('/stock-items/lookup', {
        params: { barcode: code, type },
      }),
    onSuccess: (item) => {
      onFound(item)
      setBarcode('')
      inputRef.current?.focus()
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : 'Gagal memindai barcode, silakan coba lagi.'
      toast.error(message)
      setBarcode('')
      inputRef.current?.focus()
    },
  })

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = barcode.trim()
    if (!trimmed || lookupMutation.isPending) return
    lookupMutation.mutate(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <ScanBarcode className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="barcode-scan-input"
          ref={inputRef}
          value={barcode}
          onChange={(event) => setBarcode(event.target.value)}
          placeholder="Scan atau ketik barcode..."
          className="pl-9"
          disabled={lookupMutation.isPending}
        />
      </div>
      <Button type="submit" disabled={lookupMutation.isPending}>
        {lookupMutation.isPending ? <Loader2 className="animate-spin" /> : <ScanBarcode />}
        Scan
      </Button>
    </form>
  )
}
