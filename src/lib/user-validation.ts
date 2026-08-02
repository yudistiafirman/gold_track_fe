import type { Role } from '@/types/role'

export interface UserFormValues {
  name: string
  email: string
  password: string
  role: Role | ''
}

export interface UserFormErrors {
  name?: string
  email?: string
  password?: string
  role?: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * `requirePassword` distinguishes create (password mandatory) from edit
 * (blank password = "keep current password", per FE-1401's note — never
 * treat an empty edit password field as "set password to empty").
 */
export function validateUserForm(
  values: UserFormValues,
  { requirePassword }: { requirePassword: boolean },
): UserFormErrors {
  const errors: UserFormErrors = {}

  if (!values.name.trim()) errors.name = 'Nama wajib diisi'

  if (!values.email.trim()) {
    errors.email = 'Email wajib diisi'
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Format email tidak valid'
  }

  if (requirePassword && !values.password.trim()) {
    errors.password = 'Password wajib diisi'
  }

  if (!values.role) errors.role = 'Role wajib dipilih'

  return errors
}
