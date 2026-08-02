import { useMutation } from '@tanstack/react-query'
import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import { type AuthUser, useAuthStore } from '@/store/auth-store'

interface LoginPayload {
  email: string
  password: string
}

interface LoginResponse {
  token: string
  user: AuthUser
}

const GENERIC_ERROR_MESSAGE = 'Terjadi kesalahan, silakan coba lagi.'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const setAuth = useAuthStore((state) => state.setAuth)
  const navigate = useNavigate()

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) =>
      api.post<LoginResponse, LoginPayload>('/auth/login', payload),
    onSuccess: (data) => {
      setAuth(data.token, data.user)
      navigate('/', { replace: true })
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loginMutation.isPending) return
    loginMutation.mutate({ email, password })
  }

  const errorMessage = loginMutation.isError
    ? loginMutation.error instanceof ApiError
      ? loginMutation.error.message
      : GENERIC_ERROR_MESSAGE
    : null

  return (
    <div className="flex min-h-svh items-center justify-center bg-gray-50 px-4">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-lg border border-border bg-card p-6 shadow-card">
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-h2 text-gray-900">Masuk ke GoldTrack</h1>
          <p className="text-caption text-gray-500">Gunakan email dan password akun Anda.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <FormField label="Email" htmlFor="login-email" required>
            <Input
              id="login-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={loginMutation.isPending}
              required
            />
          </FormField>

          <FormField label="Password" htmlFor="login-password" required>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={loginMutation.isPending}
              required
            />
          </FormField>

          {errorMessage && (
            <p role="alert" className="rounded-sm border border-error/30 bg-error/10 px-3 py-2 text-caption text-error">
              {errorMessage}
            </p>
          )}

          <Button type="submit" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? 'Memproses...' : 'Masuk'}
          </Button>
        </form>
      </div>
    </div>
  )
}
