import { useMutation } from '@tanstack/react-query'
import {
  AlertCircle,
  BarChart3,
  Eye,
  EyeOff,
  Gem,
  HelpCircle,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import { type KeyboardEvent, type SubmitEvent, useState } from 'react'
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

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Akses aman berbasis peran',
    description: 'Setiap kasir dan admin punya izin sesuai tanggung jawabnya.',
  },
  {
    icon: TrendingUp,
    title: 'Harga emas real-time',
    description: 'Referensi harga selalu update untuk transaksi jual-beli.',
  },
  {
    icon: BarChart3,
    title: 'Laporan otomatis',
    description: 'Stok, penjualan, dan buyback terekap tanpa input manual.',
  },
]

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [capsLockOn, setCapsLockOn] = useState(false)
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

  function handlePasswordKeyEvent(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLockOn(event.getModifierState('CapsLock'))
  }

  const errorMessage = loginMutation.isError
    ? loginMutation.error instanceof ApiError
      ? loginMutation.error.message
      : GENERIC_ERROR_MESSAGE
    : null

  return (
    <div className="flex min-h-svh w-full flex-col bg-gray-50 md:flex-row">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-gray-900 p-10 text-white md:flex md:w-[46%] lg:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.15] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.6)_1px,transparent_0)] [background-size:22px_22px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-20 size-80 rounded-full bg-green-500/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-16 size-72 rounded-full bg-gray-900/60 blur-3xl"
        />

        <div className="relative z-10 flex animate-in fade-in slide-in-from-top-2 items-center gap-3 duration-700">
          <div className="flex size-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-sm">
            <Gem className="size-5" />
          </div>
          <span className="text-h3 font-semibold tracking-tight text-white">GoldTrack</span>
        </div>

        <div className="relative z-10 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="mb-4 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-caption text-white/80 backdrop-blur-sm">
            Sistem Manajemen Toko Emas
          </span>
          <h1 className="text-h1 mb-3 text-white">Kelola toko emas Anda dengan percaya diri</h1>
          <p className="text-body text-white/70">
            Satu platform untuk transaksi jual-beli, stok, purchase order, dan laporan — semuanya
            rapi dan real-time.
          </p>

          <ul className="mt-8 flex flex-col gap-4">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex items-start gap-3">
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 backdrop-blur-sm">
                  <feature.icon className="size-4 text-white" />
                </div>
                <div>
                  <p className="text-label font-medium text-white">{feature.title}</p>
                  <p className="text-caption text-white/60">{feature.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-caption text-white/40">
          <span>© {new Date().getFullYear()} GoldTrack</span>
          <span>v1.0</span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 flex items-center justify-center gap-2.5 md:hidden">
            <div className="flex size-9 items-center justify-center rounded-lg bg-green-500 text-white shadow-card">
              <Gem className="size-4" />
            </div>
            <span className="text-h3 font-semibold text-gray-900">GoldTrack</span>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-border bg-card p-8 shadow-modal duration-500">
            <div className="mb-8 text-center md:text-left">
              <h2 className="text-h2 mb-1.5 text-gray-900">Selamat datang kembali</h2>
              <p className="text-body text-gray-500">
                Masuk untuk mengakses dashboard toko Anda
              </p>
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
                    className="h-11 rounded-lg pl-9"
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
                    onKeyUp={handlePasswordKeyEvent}
                    onKeyDown={handlePasswordKeyEvent}
                    disabled={loginMutation.isPending}
                    required
                    className="h-11 rounded-lg pr-10 pl-9"
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
                {capsLockOn && <p className="text-caption text-warning">Caps Lock aktif</p>}
              </FormField>

              {errorMessage && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-error/30 bg-error/10 px-3 py-2.5 text-caption text-error"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="mt-2 h-11 rounded-lg bg-gradient-to-r from-green-500 to-green-600 shadow-card hover:from-green-600 hover:to-green-700"
              >
                {loginMutation.isPending && <Loader2 className="animate-spin" />}
                {loginMutation.isPending ? 'Memproses...' : 'Masuk'}
              </Button>
            </form>
          </div>

          <p className="mt-6 flex items-center justify-center gap-2 text-caption text-gray-500">
            <HelpCircle className="size-4 text-muted-foreground" />
            Hubungi admin jika lupa password
          </p>
        </div>
      </div>
    </div>
  )
}
