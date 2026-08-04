import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, History, Loader2, Play, ScanBarcode } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import type { StockOpname } from '@/types/stock-opname'

interface StartOpnamePayload {
  notes: string | null
}

interface InProgressListResponse {
  items: StockOpname[]
}

export function StartOpnamePage() {
  const navigate = useNavigate()
  const [notes, setNotes] = useState('')

  // Cara A: only one IN_PROGRESS session is allowed at a time, so check for
  // one before showing the create form — if it exists, steer the user to
  // resume it instead of letting them hit the 409 from POST.
  const inProgressQuery = useQuery({
    queryKey: ['stock-opnames', { status: 'IN_PROGRESS', page: 1 }],
    queryFn: () =>
      api.get<InProgressListResponse>('/stock-opnames', {
        params: { status: 'IN_PROGRESS', page: 1, limit: 1 },
      }),
  })

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

  // Cara B (defense-in-depth): even if the check above says "clear", a race
  // with another device could still get a 409 back from the create call —
  // surface the same resume path via the history page in that case too.
  const isConflict =
    startMutation.isError && startMutation.error instanceof ApiError && startMutation.error.code === 'CONFLICT'

  const activeOpname = inProgressQuery.data?.items[0] ?? null

  if (inProgressQuery.isPending) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (activeOpname) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-border bg-card p-8 text-center shadow-card">
        <div className="flex size-14 items-center justify-center rounded-full bg-warning/10">
          <ScanBarcode className="size-7 text-warning" />
        </div>
        <div>
          <h1 className="text-h2 text-gray-900">Ada Sesi Opname Belum Selesai</h1>
          <p className="text-caption text-gray-500">
            Sesi {activeOpname.opname_code} masih berjalan — selesaikan atau lanjutkan sesi itu
            dulu sebelum membuat sesi baru.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2">
          <Button asChild size="lg">
            <Link to={`/stock-opnames/${activeOpname.id}/scan`}>
              <Play />
              Lanjutkan Sesi Ini
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/stock-opnames">
              <History />
              Lihat Riwayat Opname
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link to="/stock-opnames">
          <ArrowLeft />
          Kembali
        </Link>
      </Button>

      <div className="flex flex-col gap-6 rounded-lg border border-border bg-card p-8 shadow-card">
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
          <div className="flex flex-col gap-2 rounded-sm border border-error/30 bg-error/10 px-3 py-2">
            <p role="alert" className="text-caption text-error">
              {errorMessage}
            </p>
            {isConflict && (
              <Button asChild size="sm" variant="secondary" className="w-fit">
                <Link to="/stock-opnames">
                  <History />
                  Lihat Riwayat Opname
                </Link>
              </Button>
            )}
          </div>
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
    </div>
  )
}
