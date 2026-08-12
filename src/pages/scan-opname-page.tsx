import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle2, Loader2, ScanBarcode } from 'lucide-react'
import { type SubmitEvent, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { StatusBadge } from '@/components/status-badge'
import { NotScannedBreakdownDialog } from '@/components/stock-opnames/not-scanned-breakdown-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import { networkRetryDelay, retryOnNetworkError } from '@/lib/api/retry'
import { OPNAME_RESULT_TONE, OPNAME_SESSION_STATUS_TONE, resolveStatusTone } from '@/lib/domain-status'
import { focusAfterPaint } from '@/lib/focus-after-paint'
import { NotFoundPage } from '@/pages/not-found-page'
import type {
  NotScannedItem,
  NotScannedWeightGroup,
  ScanOpnameResult,
  StockOpname,
  StockOpnameDetail,
} from '@/types/stock-opname'

interface ScanFeedEntry extends Omit<ScanOpnameResult, 'not_scanned'> {
  key: string
  time: string
}

interface ScanPayload {
  barcode: string
}

export function ScanOpnamePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const [barcode, setBarcode] = useState('')
  const [feed, setFeed] = useState<ScanFeedEntry[]>([])
  const [counts, setCounts] = useState({ match: 0, unexpected: 0, notScanned: 0 })
  const [notScannedDetail, setNotScannedDetail] = useState<{
    items: NotScannedItem[]
    byWeight: NotScannedWeightGroup[]
  }>({ items: [], byWeight: [] })
  const [seeded, setSeeded] = useState(false)
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false)
  const [showNotScannedBreakdown, setShowNotScannedBreakdown] = useState(false)

  const opnameQuery = useQuery({
    queryKey: ['stock-opnames', id],
    queryFn: () => api.get<StockOpnameDetail>(`/stock-opnames/${id}`),
    enabled: id !== undefined,
    retry: false,
  })

  const opname = opnameQuery.data

  useEffect(() => {
    if (!opname || seeded) return
    setCounts({
      match: opname.summary.match,
      unexpected: opname.summary.unexpected,
      notScanned: opname.summary.not_scanned,
    })
    setNotScannedDetail({
      items: opname.not_scanned_items ?? [],
      byWeight: opname.not_scanned_by_weight ?? [],
    })
    // Resuming an in-progress session: BE now includes items[] for
    // IN_PROGRESS too (not just COMPLETED), so re-populate the scan feed
    // from it instead of starting with an empty list. MISSING can't occur
    // here (only known once the session completes), but the item type
    // allows it, so it's filtered out defensively.
    if (opname.items && opname.items.length > 0) {
      setFeed(
        opname.items
          .filter((item) => item.result !== 'MISSING')
          .map((item) => ({
            ...item,
            result: item.result as 'MATCH' | 'UNEXPECTED',
            key: item.id,
            time: item.scanned_at ? new Date(item.scanned_at).toLocaleTimeString('id-ID') : '—',
          })),
      )
    }
    setSeeded(true)
  }, [opname, seeded])

  useEffect(() => {
    // Depends on `opname`, not just mount: the first render (while the
    // query is still pending) shows the skeleton branch below, so the real
    // <Input> doesn't exist yet and this ref is still null at that point.
    if (!opname) return
    focusAfterPaint(() => inputRef.current?.focus())
  }, [opname])

  const scanMutation = useMutation({
    mutationFn: (payload: ScanPayload) =>
      api.post<ScanOpnameResult, ScanPayload>(`/stock-opnames/${id}/scan`, payload),
    retry: retryOnNetworkError,
    retryDelay: networkRetryDelay,
    onSuccess: (result) => {
      setFeed((prev) => [
        { ...result, key: crypto.randomUUID(), time: new Date().toLocaleTimeString('id-ID') },
        ...prev,
      ])
      setCounts((prev) => ({
        match: prev.match + (result.result === 'MATCH' ? 1 : 0),
        unexpected: prev.unexpected + (result.result === 'UNEXPECTED' ? 1 : 0),
        notScanned: result.not_scanned,
      }))
      setNotScannedDetail({
        items: result.not_scanned_items ?? [],
        byWeight: result.not_scanned_by_weight ?? [],
      })
      setBarcode('')
      focusAfterPaint(() => inputRef.current?.focus())
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : 'Gagal memindai barcode, silakan coba lagi.'
      toast.error(message)
      setBarcode('')
      focusAfterPaint(() => inputRef.current?.focus())
    },
  })

  const completeMutation = useMutation({
    mutationFn: () => api.post<StockOpname>(`/stock-opnames/${id}/complete`),
    onSuccess: (completed) => {
      queryClient.invalidateQueries({ queryKey: ['stock-opnames', id] })
      navigate(`/stock-opnames/${completed.id}`)
    },
  })

  // Covers both 404 (not found) and 400 (invalid id) — ApiError doesn't carry
  // HTTP status, and both need the same graceful, non-crashing page.
  if (opnameQuery.isError) {
    return <NotFoundPage />
  }

  if (opnameQuery.isPending || !opname) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // AC3 (FE-1103): a COMPLETED session can't be reopened for scanning —
  // guards direct navigation here after the button elsewhere is hidden, or
  // the session was already closed in another tab.
  if (opname.status !== 'IN_PROGRESS') {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 text-center shadow-card">
        <p className="text-body text-gray-700">
          Sesi {opname.opname_code} sudah <strong>{opname.status}</strong> dan tidak bisa discan
          lagi.
        </p>
        <Button asChild variant="secondary">
          <Link to={`/stock-opnames/${opname.id}`}>
            <ArrowLeft />
            Lihat Hasil
          </Link>
        </Button>
      </div>
    )
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = barcode.trim()
    if (!trimmed || scanMutation.isPending) return
    scanMutation.mutate({ barcode: trimmed })
  }

  function handleCompleteClick() {
    if (counts.notScanned > 0) {
      setShowCompleteConfirm(true)
      return
    }
    completeMutation.mutate()
  }

  const totalScanned = counts.match + counts.unexpected

  const errorMessage = completeMutation.isError
    ? completeMutation.error instanceof ApiError
      ? completeMutation.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-h1 text-gray-900">Scan Opname</h1>
          <StatusBadge
            tone={resolveStatusTone(OPNAME_SESSION_STATUS_TONE, opname.status)}
            label={opname.status}
          />
        </div>
        <span className="rounded-lg border border-border bg-card px-3 py-1.5 text-body font-medium tabular-nums text-gray-900 shadow-card">
          {opname.opname_code}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-card">
          <div>
            <p className="text-caption text-gray-500">Total Discan</p>
            <p className="text-h2 tabular-nums text-gray-900">{totalScanned.toLocaleString('id-ID')}</p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-full bg-gray-100">
            <ScanBarcode className="size-5 text-gray-600" />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-card">
          <div>
            <p className="text-caption text-gray-500">Match</p>
            <p className="text-h2 tabular-nums text-success">{counts.match.toLocaleString('id-ID')}</p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="size-5 text-success" />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-card">
          <div>
            <p className="text-caption text-gray-500">Unexpected</p>
            <p className="text-h2 tabular-nums text-warning">
              {counts.unexpected.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-full bg-warning/10">
            <ScanBarcode className="size-5 text-warning" />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowNotScannedBreakdown(true)}
          disabled={counts.notScanned === 0}
          className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-left shadow-card transition-colors enabled:hover:bg-gray-50 disabled:cursor-default"
        >
          <div>
            <p className="text-caption text-gray-500">Belum Discan</p>
            <p className="text-h2 tabular-nums text-gray-900">
              {counts.notScanned.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-full bg-gray-100">
            <ScanBarcode className="size-5 text-gray-400" />
          </div>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 rounded-xl border border-primary/20 bg-card p-4 shadow-card">
        <div className="relative flex-1">
          <ScanBarcode className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={barcode}
            onChange={(event) => setBarcode(event.target.value)}
            placeholder={
              scanMutation.isPending && scanMutation.failureCount > 0
                ? 'Koneksi lambat, mencoba lagi...'
                : 'Scan atau ketik barcode...'
            }
            className="pl-9"
            disabled={scanMutation.isPending}
          />
        </div>
        <Button type="submit" disabled={scanMutation.isPending}>
          {scanMutation.isPending ? <Loader2 className="animate-spin" /> : <ScanBarcode />}
          {scanMutation.isPending && scanMutation.failureCount > 0 ? 'Mencoba lagi...' : 'Scan'}
        </Button>
      </form>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-gray-100">
            <CheckCircle2 className="size-4 text-gray-600" />
          </div>
          <h2 className="text-h3 text-gray-900">Riwayat Scan</h2>
        </div>

        {feed.length === 0 ? (
          <p className="py-6 text-center text-caption text-gray-500">Belum ada unit yang discan.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {feed.map((entry) => (
              <div
                key={entry.key}
                className="flex items-center justify-between gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <span className="w-20 text-caption tabular-nums text-gray-500">{entry.time}</span>
                  <span className="w-24 text-caption tabular-nums text-gray-500">{entry.barcode}</span>
                  <span className="text-body text-gray-900">{entry.product_name}</span>
                </div>
                <StatusBadge tone={OPNAME_RESULT_TONE[entry.result]} label={entry.result} />
              </div>
            ))}
          </div>
        )}
      </div>

      {errorMessage && (
        <p
          role="alert"
          className="rounded-sm border border-error/30 bg-error/10 px-3 py-2 text-caption text-error"
        >
          {errorMessage}
        </p>
      )}

      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleCompleteClick}
          disabled={completeMutation.isPending}
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
        >
          {completeMutation.isPending && <Loader2 className="animate-spin" />}
          {completeMutation.isPending ? 'Menyelesaikan...' : 'Selesaikan Opname'}
        </Button>
      </div>

      <ConfirmDialog
        open={showCompleteConfirm}
        onOpenChange={setShowCompleteConfirm}
        title="Masih ada unit yang belum discan"
        description={`Masih ada ${counts.notScanned.toLocaleString('id-ID')} unit yang belum discan. Unit yang belum discan akan otomatis tercatat sebagai MISSING begitu opname diselesaikan. Yakin ingin melanjutkan?`}
        confirmLabel="Selesaikan Opname"
        variant="destructive"
        isLoading={completeMutation.isPending}
        onConfirm={() => {
          setShowCompleteConfirm(false)
          completeMutation.mutate()
        }}
      />

      <NotScannedBreakdownDialog
        open={showNotScannedBreakdown}
        onOpenChange={setShowNotScannedBreakdown}
        items={notScannedDetail.items}
        byWeight={notScannedDetail.byWeight}
      />
    </div>
  )
}
