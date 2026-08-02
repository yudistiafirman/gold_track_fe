import { useMutation } from '@tanstack/react-query'
import { Loader2, Play, ScanBarcode } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import type { StockOpname } from '@/types/stock-opname'

interface StartOpnamePayload {
  notes: string | null
}

export function StartOpnamePage() {
  const navigate = useNavigate()
  const [notes, setNotes] = useState('')

  const startMutation = useMutation({
    mutationFn: (payload: StartOpnamePayload) =>
      api.post<StockOpname, StartOpnamePayload>('/stock-opnames', payload),
    onSuccess: (opname) => {
      navigate(`/stock-opnames/${opname.id}/scan`)
    },
  })

  const errorMessage = startMutation.isError
    ? startMutation.error instanceof ApiError
      ? startMutation.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : null

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-lg border border-border bg-card p-8 shadow-card">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
          <ScanBarcode className="size-7 text-primary" />
        </div>
        <div>
          <h1 className="text-h2 text-gray-900">Mulai Sesi Opname Baru</h1>
          <p className="text-caption text-gray-500">Cocokkan stok fisik dengan data sistem</p>
        </div>
      </div>

      <p className="rounded-md bg-muted/50 p-4 text-caption text-gray-600">
        Sistem akan mencatat setiap unit yang kamu scan, lalu membandingkannya dengan data stok.
        Unit yang tidak discan akan ditandai <span className="font-medium text-error">hilang</span>{' '}
        saat sesi ditutup.
      </p>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="opname-notes" className="text-label text-gray-700 uppercase">
          Catatan
        </label>
        <Textarea
          id="opname-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Catatan sesi opname, mis. lokasi/etalase"
          disabled={startMutation.isPending}
        />
      </div>

      {errorMessage && (
        <p
          role="alert"
          className="rounded-sm border border-error/30 bg-error/10 px-3 py-2 text-caption text-error"
        >
          {errorMessage}
        </p>
      )}

      <Button
        size="lg"
        onClick={() => startMutation.mutate({ notes: notes.trim() || null })}
        disabled={startMutation.isPending}
      >
        {startMutation.isPending ? <Loader2 className="animate-spin" /> : <Play />}
        {startMutation.isPending ? 'Menyiapkan Sesi...' : 'Mulai Opname'}
      </Button>
    </div>
  )
}
