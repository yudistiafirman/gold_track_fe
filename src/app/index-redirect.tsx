import { Navigate } from 'react-router-dom'
import { useCurrentRole } from '@/store/auth-store'

/** Only Super Admin has dashboard access — everyone else lands on a role-appropriate page. */
export function IndexRedirect() {
  const role = useCurrentRole()

  if (role === 'KASIR') return <Navigate to="/sell" replace />
  if (role === 'SUPER_ADMIN') return <Navigate to="/dashboard" replace />
  return <Navigate to="/products" replace />
}
