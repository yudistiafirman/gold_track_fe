import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Store } from 'lucide-react'
import { type SubmitEvent, useEffect, useState } from 'react'
import { EmptyState } from '@/components/empty-state'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import { showSuccessToast } from '@/lib/toast'
import type { Setting } from '@/types/setting'

const SETTING_KEYS = ['shop_name', 'shop_address', 'shop_phone'] as const
type SettingKey = (typeof SETTING_KEYS)[number]
type SettingValues = Record<SettingKey, string>
type SettingFieldErrors = Partial<Record<SettingKey, string>>

const FIELD_CONFIG: { key: SettingKey; label: string; multiline?: boolean }[] = [
  { key: 'shop_name', label: 'Nama Toko' },
  { key: 'shop_address', label: 'Alamat Toko', multiline: true },
  { key: 'shop_phone', label: 'Nomor Telepon' },
]

const GENERIC_SAVE_ERROR = 'Gagal menyimpan pengaturan, coba lagi atau hubungi admin sistem.'
const EMPTY_FIELD_ERROR = 'Field ini tidak boleh dikosongkan.'

function emptyValues(): SettingValues {
  return { shop_name: '', shop_address: '', shop_phone: '' }
}

/** Response is a key-value array, not an object — must map by `key`, the array order is alphabetical (not display order). */
function mapSettingsToValues(settings: Setting[]): SettingValues {
  const byKey = new Map(settings.map((setting) => [setting.key, setting.value]))
  const values = emptyValues()
  for (const key of SETTING_KEYS) {
    values[key] = byKey.get(key) ?? ''
  }
  return values
}

function mapSettingsToDescriptions(settings: Setting[]): Partial<Record<SettingKey, string>> {
  const descriptions: Partial<Record<SettingKey, string>> = {}
  for (const setting of settings) {
    if ((SETTING_KEYS as readonly string[]).includes(setting.key)) {
      descriptions[setting.key as SettingKey] = setting.description
    }
  }
  return descriptions
}

export function SettingsPage() {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<SettingValues | null>(null)
  const [initialValues, setInitialValues] = useState<SettingValues | null>(null)
  const [fieldErrors, setFieldErrors] = useState<SettingFieldErrors>({})

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<Setting[]>('/settings'),
  })

  useEffect(() => {
    if (!settingsQuery.data) return
    const mapped = mapSettingsToValues(settingsQuery.data)
    setValues(mapped)
    setInitialValues(mapped)
  }, [settingsQuery.data])

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<SettingValues>) =>
      api.put<Setting[], Partial<SettingValues>>('/settings', payload),
    onSuccess: (settings) => {
      queryClient.setQueryData(['settings'], settings)
      setFieldErrors({})
      showSuccessToast('Pengaturan toko berhasil disimpan.')
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'BAD_REQUEST') {
        const matchedKey = SETTING_KEYS.find((key) => error.message.startsWith(key))
        if (matchedKey) {
          setFieldErrors({ [matchedKey]: EMPTY_FIELD_ERROR })
          return
        }
      }
      setFieldErrors({})
    },
  })

  const descriptions = settingsQuery.data ? mapSettingsToDescriptions(settingsQuery.data) : {}

  const dirtyKeys =
    values && initialValues ? SETTING_KEYS.filter((key) => values[key] !== initialValues[key]) : []
  const hasFieldError = Object.values(fieldErrors).some(Boolean)

  const bannerMessage =
    updateMutation.isError && !hasFieldError
      ? updateMutation.error instanceof ApiError && updateMutation.error.code !== 'INTERNAL_ERROR'
        ? updateMutation.error.message
        : GENERIC_SAVE_ERROR
      : null

  function handleChange(key: SettingKey, value: string) {
    setValues((prev) => (prev ? { ...prev, [key]: value } : prev))
    setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))
  }

  function handleReset() {
    if (!initialValues) return
    setValues(initialValues)
    setFieldErrors({})
    updateMutation.reset()
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!values || dirtyKeys.length === 0 || updateMutation.isPending) return

    const validationErrors: SettingFieldErrors = {}
    for (const key of dirtyKeys) {
      if (!values[key].trim()) {
        validationErrors[key] = EMPTY_FIELD_ERROR
      }
    }
    setFieldErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const payload: Partial<SettingValues> = {}
    for (const key of dirtyKeys) {
      payload[key] = values[key].trim()
    }
    updateMutation.mutate(payload)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h1 text-gray-900">Pengaturan Toko</h1>
        <p className="text-caption text-gray-500">
          Data toko yang tampil di header struk transaksi.
        </p>
      </div>

      {settingsQuery.isPending ? (
        <div className="flex max-w-md flex-col gap-5 rounded-lg border border-border bg-card p-6 shadow-card">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : settingsQuery.isError ? (
        <EmptyState
          icon={Store}
          title="Gagal memuat pengaturan"
          description={
            settingsQuery.error instanceof ApiError
              ? settingsQuery.error.message
              : 'Terjadi kesalahan, silakan coba lagi.'
          }
        />
      ) : (
        values && (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex max-w-md flex-col gap-5 rounded-lg border border-border bg-card p-6 shadow-card"
          >
            {FIELD_CONFIG.map(({ key, label, multiline }) => (
              <FormField
                key={key}
                label={label}
                htmlFor={`setting-${key}`}
                required
                error={fieldErrors[key]}
                description={!fieldErrors[key] ? descriptions[key] : undefined}
              >
                {multiline ? (
                  <Textarea
                    id={`setting-${key}`}
                    value={values[key]}
                    onChange={(event) => handleChange(key, event.target.value)}
                    disabled={updateMutation.isPending}
                  />
                ) : (
                  <Input
                    id={`setting-${key}`}
                    value={values[key]}
                    onChange={(event) => handleChange(key, event.target.value)}
                    disabled={updateMutation.isPending}
                  />
                )}
              </FormField>
            ))}

            {bannerMessage && (
              <p
                role="alert"
                className="rounded-sm border border-error/30 bg-error/10 px-3 py-2 text-caption text-error"
              >
                {bannerMessage}
              </p>
            )}

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handleReset}
                disabled={dirtyKeys.length === 0 || updateMutation.isPending}
              >
                Batalkan Perubahan
              </Button>
              <Button type="submit" disabled={dirtyKeys.length === 0 || updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="animate-spin" />}
                {updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        )
      )}
    </div>
  )
}
