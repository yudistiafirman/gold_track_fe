import { SearchX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-gray-100">
        <SearchX className="size-8 text-gray-500" />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-caption font-medium text-gray-500 uppercase tracking-wide">
          Error 404
        </span>
        <h1 className="text-h1 text-gray-900">Halaman Tidak Ditemukan</h1>
        <p className="max-w-sm text-body text-gray-500">
          Halaman yang Anda cari tidak ada atau sudah dipindahkan.
        </p>
      </div>
      <Button
        asChild
        className="mt-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
      >
        <Link to="/">Kembali ke Dashboard</Link>
      </Button>
    </div>
  )
}
