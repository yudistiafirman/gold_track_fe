import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, Gem, HelpCircle, Loader2, Lock, Mail } from 'lucide-react'
import { type SubmitEvent, useState } from 'react'
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
  const [showPassword, setShowPassword] = useState(false)
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

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
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
    <div className="flex min-h-svh w-full flex-col bg-gray-50 md:flex-row">
      <div className="relative hidden flex-col items-center justify-center overflow-hidden bg-green-500 p-8 text-white md:flex md:w-[45%]">
        <div className="relative z-10 flex flex-col items-center space-y-6 text-center">
          <div className="mb-4 flex size-24 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-xl backdrop-blur-sm">
            <Gem className="size-11" />
          </div>
          <div>
            <h1 className="text-h1 mb-2 text-white">GoldTrack</h1>
            <p className="mx-auto max-w-[250px] text-body text-white/80">
              Sistem manajemen toko emas
            </p>
          </div>
        </div>
        <div className="absolute right-8 bottom-8 left-8 flex items-center justify-between text-caption text-white/40">
          <span>© {new Date().getFullYear()} GoldTrack</span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[400px] rounded-lg border border-border bg-card p-8 shadow-card">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-h2 mb-2 text-gray-900">Masuk</h2>
            <p className="text-body text-gray-500">Masuk ke akun Anda untuk melanjutkan</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <FormField label="Email" htmlFor="login-email" required>
              <div className="relative flex items-center">
                <Mail className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  placeholder="nama@toko.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={loginMutation.isPending}
                  required
                  className="pl-9"
                />
              </div>
            </FormField>

            <FormField label="Password" htmlFor="login-password" required>
              <div className="relative flex items-center">
                <Lock className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loginMutation.isPending}
                  required
                  className="pr-10 pl-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  disabled={loginMutation.isPending}
                  className="absolute right-3 flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </FormField>

            {errorMessage && (
              <p
                role="alert"
                className="rounded-sm border border-error/30 bg-error/10 px-3 py-2 text-caption text-error"
              >
                {errorMessage}
              </p>
            )}

            <Button type="submit" disabled={loginMutation.isPending} className="mt-2">
              {loginMutation.isPending && <Loader2 className="animate-spin" />}
              {loginMutation.isPending ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 border-t border-border pt-6 text-caption text-gray-500">
            <HelpCircle className="size-4 text-muted-foreground" />
            Hubungi admin jika lupa password
          </div>
        </div>
      </div>
    </div>
  )
}
