import { Navigate, Outlet } from 'react-router-dom'
import { useCurrentRole } from '@/store/auth-store'
import type { Role } from '@/types/role'

interface RoleGuardProps {
  roles: Role[]
}

export function RoleGuard({ roles }: RoleGuardProps) {
  const role = useCurrentRole()

  if (!role || !roles.includes(role)) {
    return <Navigate to="/403" replace />
  }

  return <Outlet />
}
