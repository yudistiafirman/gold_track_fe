import axios, { type AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { env } from '@/lib/env'
import { redirect } from '@/lib/navigation'
import { getAuthToken, useAuthStore } from '@/store/auth-store'
import type { ApiEnvelope } from '@/types/api'
import { ApiError } from './error'

export const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
})

httpClient.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

httpClient.interceptors.response.use(
  (response) => {
    const envelope = response.data as ApiEnvelope<unknown>
    if (!envelope.success) {
      throw new ApiError(envelope.error.code, envelope.error.message)
    }
    return envelope.data as unknown as AxiosResponse
  },
  (error: AxiosError<ApiEnvelope<unknown>>) => {
    const status = error.response?.status

    const isLoginRequest = error.config?.url?.includes('/auth/login')

    if (status === 401 && !isLoginRequest) {
      useAuthStore.getState().clearAuth()
      if (window.location.pathname !== '/login') {
        redirect('/login')
      }
    }

    if (status === 403 && window.location.pathname !== '/403') {
      redirect('/403')
    }

    const envelope = error.response?.data
    if (envelope && !envelope.success) {
      return Promise.reject(new ApiError(envelope.error.code, envelope.error.message))
    }
    return Promise.reject(new ApiError('NETWORK_ERROR', error.message))
  },
)

/**
 * Typed request helpers. The response interceptor above unwraps the
 * {success,data} envelope, so callers get `T` directly instead of
 * axios' `AxiosResponse<T>` — the `R = T` generic keeps types honest.
 */
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) => httpClient.get<T, T>(url, config),
  post: <T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig) =>
    httpClient.post<T, T, B>(url, body, config),
  put: <T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig) =>
    httpClient.put<T, T, B>(url, body, config),
  patch: <T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig) =>
    httpClient.patch<T, T, B>(url, body, config),
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    httpClient.delete<T, T>(url, config),
}
