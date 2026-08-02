import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from '@/types/role'

export interface AuthUser {
  id: string
  name: string
  role: Role
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  setAuth: (token: string, user: AuthUser) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
    }),
    {
      name: 'auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
)

export function getAuthToken(): string | null {
  return useAuthStore.getState().token
}

export function useCurrentRole(): Role | null {
  return useAuthStore((state) => state.user?.role ?? null)
}
