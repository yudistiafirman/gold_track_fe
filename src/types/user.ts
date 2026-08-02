import type { Role } from '@/types/role'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  is_active: boolean
  last_login_at: string | null
  created_at: string
}
