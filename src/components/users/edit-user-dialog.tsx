import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { type SubmitEvent, useEffect, useState } from 'react'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import { showErrorToast, showSuccessToast } from '@/lib/toast'
import {
  type UserFormErrors,
  type UserFormValues,
  validateUserForm,
} from '@/lib/user-validation'
import { ROLES, type Role } from '@/types/role'
import type { User } from '@/types/user'

interface UpdateUserPayload {
  name: string
  email: string
  role: Role
  is_active: boolean
  password?: string
}

interface EditUserDialogProps {
  userId: string | null
  onClose: () => void
}

export function EditUserDialog({ userId, onClose }: EditUserDialogProps) {
  const queryClient = useQueryClient()
  const open = userId !== null
  const [values, setValues] = useState<UserFormValues | null>(null)
  const [isActive, setIsActive] = useState(true)
  const [errors, setErrors] = useState<UserFormErrors>({})

  const userQuery = useQuery({
    queryKey: ['users', userId],
    queryFn: () => api.get<User>(`/users/${userId}`),
    enabled: open,
    retry: false,
  })

  useEffect(() => {
    if (userQuery.data) {
      setValues({
        name: userQuery.data.name,
        email: userQuery.data.email,
        // Password is write-only and never returned — the field always
        // starts empty; leaving it empty on submit means "keep current".
        password: '',
        role: userQuery.data.role,
      })
      setIsActive(userQuery.data.is_active)
    }
  }, [userQuery.data])

  useEffect(() => {
    if (!userQuery.isError) return
    showErrorToast(userQuery.error, 'User tidak ditemukan.')
    queryClient.invalidateQueries({ queryKey: ['users'] })
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userQuery.isError])

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateUserPayload) =>
      api.put<User, UpdateUserPayload>(`/users/${userId}`, payload),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      showSuccessToast(`User "${user.name}" berhasil diperbarui.`)
      handleClose()
    },
  })

  function handleClose() {
    setValues(null)
    setErrors({})
    updateMutation.reset()
    onClose()
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!values || updateMutation.isPending) return

    const validationErrors = validateUserForm(values, { requirePassword: false })
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    updateMutation.mutate({
      name: values.name.trim(),
      email: values.email.trim(),
      role: values.role as Role,
      is_active: isActive,
      // Never send an empty string as "the new password" — omit the field
      // entirely so the BE keeps the existing one.
      ...(values.password.trim() ? { password: values.password } : {}),
    })
  }

  // FE-1401 AC4: email conflict (409) shows inline on the Email field rather
  // than a generic banner/toast. Password policy errors (400) are also
  // field-level, so route by message content — see the matching comment in
  // CreateUserDialog for why.
  const submitErrorMessage = updateMutation.isError
    ? updateMutation.error instanceof ApiError
      ? updateMutation.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : undefined
  const isPasswordSubmitError = submitErrorMessage?.toLowerCase().includes('password') ?? false
  const emailError = errors.email ?? (isPasswordSubmitError ? undefined : submitErrorMessage)
  const passwordError = errors.password ?? (isPasswordSubmitError ? submitErrorMessage : undefined)

  const isPrefilling = userQuery.isPending || values === null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Perbarui detail akun pengguna.</DialogDescription>
        </DialogHeader>

        {isPrefilling ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <FormField label="Nama" htmlFor="edit-user-name" required error={errors.name}>
              <Input
                id="edit-user-name"
                value={values.name}
                onChange={(event) =>
                  setValues((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                }
                disabled={updateMutation.isPending}
              />
            </FormField>

            <FormField label="Email" htmlFor="edit-user-email" required error={emailError}>
              <Input
                id="edit-user-email"
                type="email"
                value={values.email}
                onChange={(event) =>
                  setValues((prev) => (prev ? { ...prev, email: event.target.value } : prev))
                }
                disabled={updateMutation.isPending}
              />
            </FormField>

            <FormField
              label="Password Baru"
              htmlFor="edit-user-password"
              error={passwordError}
              description="Kosongkan untuk mempertahankan password lama. Jika diisi: minimal 8 karakter, kombinasi huruf besar, huruf kecil, angka, dan simbol."
            >
              <Input
                id="edit-user-password"
                type="password"
                autoComplete="new-password"
                value={values.password}
                onChange={(event) =>
                  setValues((prev) => (prev ? { ...prev, password: event.target.value } : prev))
                }
                disabled={updateMutation.isPending}
              />
            </FormField>

            <FormField label="Role" htmlFor="edit-user-role" required error={errors.role}>
              <Select
                value={values.role}
                onValueChange={(value) =>
                  setValues((prev) => (prev ? { ...prev, role: value as Role } : prev))
                }
                disabled={updateMutation.isPending}
              >
                <SelectTrigger id="edit-user-role" className="w-full">
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div className="flex flex-col gap-0.5">
                <Label htmlFor="edit-user-active">Akun Aktif</Label>
                <p className="text-caption text-gray-500">
                  {isActive ? 'User bisa login ke sistem.' : 'User tidak bisa login (nonaktif).'}
                </p>
              </div>
              <Switch
                id="edit-user-active"
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={updateMutation.isPending}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={updateMutation.isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="animate-spin" />}
                {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
