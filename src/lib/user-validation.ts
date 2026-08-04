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
 * Mirrors the BE's first two password rules (length, then character
 * combination) so the UI can give instant feedback — checked in the same
 * order the server checks them. The third rule (common/weak password
 * denylist) only lives server-side, so it can't be duplicated here; that
 * error surfaces from the API response instead.
 */
export function validatePasswordRules(password: string): string | undefined {
  if (password.length < 8) return 'Password minimal 8 karakter'

  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasDigit = /[0-9]/.test(password)
  const hasSymbol = /[^A-Za-z0-9]/.test(password)
  if (!hasUpper || !hasLower || !hasDigit || !hasSymbol) {
    return 'Password harus mengandung kombinasi huruf besar, huruf kecil, angka, dan simbol'
  }

  return undefined
}

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
  } else if (values.password) {
    const passwordError = validatePasswordRules(values.password)
    if (passwordError) errors.password = passwordError
  }

  if (!values.role) errors.role = 'Role wajib dipilih'

  return errors
}
