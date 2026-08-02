import { Navigate } from 'react-router-dom'
import { useCurrentRole } from '@/store/auth-store'

/** Kasir has no dashboard access — they land straight on POS/Penjualan. */
export function IndexRedirect() {
  const role = useCurrentRole()
  return <Navigate to={role === 'KASIR' ? '/sell' : '/dashboard'} replace />
}
