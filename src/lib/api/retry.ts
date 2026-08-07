import { ApiError } from '@/lib/api/error'

const MAX_NETWORK_RETRIES = 2

/**
 * For mutations where retrying makes sense (e.g. barcode scan lookups) on
 * flaky wifi: only retry on connection/timeout failures, never on business
 * errors like "barcode not found" — retrying those just wastes the user's
 * time waiting for the same rejection.
 */
export function retryOnNetworkError(failureCount: number, error: unknown) {
  return error instanceof ApiError && error.code === 'NETWORK_ERROR' && failureCount < MAX_NETWORK_RETRIES
}

export function networkRetryDelay(attemptIndex: number) {
  return Math.min(1000 * 2 ** attemptIndex, 4000)
}
