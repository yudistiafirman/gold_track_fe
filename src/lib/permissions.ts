import { ADMIN_ROLES } from '@/config/nav'
import { useCurrentRole } from '@/store/auth-store'
import type { Role } from '@/types/role'

export type Action = 'create' | 'update' | 'delete'

/**
 * Per-resource action permissions. Anything not listed here defaults to
 * ADMIN_ROLES (most master-data modules are kasir read-only) — add a
 * resource entry only when a role needs an exception to that default,
 * e.g. kasir may create customers but not edit/delete them.
 *
 * This only controls what the UI shows. The backend's RequireRole
 * middleware is the actual guard — a hidden button here is UX, not security.
 */
const RESOURCE_OVERRIDES: Partial<Record<string, Partial<Record<Action, Role[]>>>> = {
  customers: {
    create: ['ADMIN', 'KASIR', 'SUPER_ADMIN'],
  },
}

export function can(role: Role | null, action: Action, resource: string): boolean {
  if (!role) return false
  const allowed = RESOURCE_OVERRIDES[resource]?.[action] ?? ADMIN_ROLES
  return allowed.includes(role)
}

export function useCan(action: Action, resource: string): boolean {
  const role = useCurrentRole()
  return can(role, action, resource)
}
