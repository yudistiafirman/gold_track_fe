import { toast } from 'sonner'
import { ApiError } from '@/lib/api/error'

export function showSuccessToast(message: string) {
  toast.success(message)
}

const DEFAULT_ERROR_MESSAGE = 'Terjadi kesalahan, silakan coba lagi.'

export function showErrorToast(error: unknown, fallback = DEFAULT_ERROR_MESSAGE) {
  if (error instanceof ApiError) {
    toast.error(error.message)
    return
  }
  toast.error(fallback)
}
