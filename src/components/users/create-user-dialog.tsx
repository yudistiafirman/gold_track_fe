import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { type SubmitEvent, useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import { showSuccessToast } from '@/lib/toast'
import { type UserFormValues, validateUserForm } from '@/lib/user-validation'
import { ROLES, type Role } from '@/types/role'
import type { User } from '@/types/user'

interface CreateUserPayload {
  name: string
  email: string
  password: string
  role: Role
}

const INITIAL_VALUES: UserFormValues = { name: '', email: '', password: '', role: '' }

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<UserFormValues>(INITIAL_VALUES)
  const [errors, setErrors] = useState<ReturnType<typeof validateUserForm>>({})

  const createMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) =>
      api.post<User, CreateUserPayload>('/users', payload),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      showSuccessToast(`User "${user.name}" berhasil ditambahkan.`)
      handleClose()
    },
  })

  function handleClose() {
    setValues(INITIAL_VALUES)
    setErrors({})
    createMutation.reset()
    onOpenChange(false)
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (createMutation.isPending) return

    const validationErrors = validateUserForm(values, { requirePassword: true })
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    createMutation.mutate({
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
      role: values.role as Role,
    })
  }

  // FE-1401 AC4: email conflict (409) shows inline on the Email field, not a
  // generic banner/toast — email is the only unique/conflicting field this
  // endpoint has, so any submit error is routed there.
  const emailError = errors.email ?? (createMutation.isError ? emailErrorMessage(createMutation.error) : undefined)

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(next) : handleClose())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah User</DialogTitle>
          <DialogDescription>Buat akun baru untuk mengakses sistem.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <FormField label="Nama" htmlFor="user-name" required error={errors.name}>
            <Input
              id="user-name"
              value={values.name}
              onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
              disabled={createMutation.isPending}
            />
          </FormField>

          <FormField label="Email" htmlFor="user-email" required error={emailError}>
            <Input
              id="user-email"
              type="email"
              value={values.email}
              onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))}
              disabled={createMutation.isPending}
            />
          </FormField>

          <FormField label="Password" htmlFor="user-password" required error={errors.password}>
            <Input
              id="user-password"
              type="password"
              autoComplete="new-password"
              value={values.password}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, password: event.target.value }))
              }
              disabled={createMutation.isPending}
            />
          </FormField>

          <FormField label="Role" htmlFor="user-role" required error={errors.role}>
            <Select
              value={values.role}
              onValueChange={(value) => setValues((prev) => ({ ...prev, role: value as Role }))}
              disabled={createMutation.isPending}
            >
              <SelectTrigger id="user-role" className="w-full">
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

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={createMutation.isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="animate-spin" />}
              {createMutation.isPending ? 'Menyimpan...' : 'Simpan User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function emailErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Terjadi kesalahan, silakan coba lagi.'
}
