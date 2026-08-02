export const ROLES = ['ADMIN', 'KASIR', 'SUPER_ADMIN'] as const

export type Role = (typeof ROLES)[number]
