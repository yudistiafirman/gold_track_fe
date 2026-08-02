import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function ForbiddenPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-semibold">403 — Akses ditolak</h1>
      <p className="text-muted-foreground">
        Anda tidak memiliki izin untuk mengakses halaman ini.
      </p>
      <Button asChild>
        <Link to="/">Kembali ke Dashboard</Link>
      </Button>
    </div>
  )
}
