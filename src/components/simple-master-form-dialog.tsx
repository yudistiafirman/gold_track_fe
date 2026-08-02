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
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import { showErrorToast, showSuccessToast } from '@/lib/toast'
import type { LookupItem } from '@/types/lookup'

interface SimpleMasterPayload {
  name: string
  is_active?: boolean
}

interface SimpleMasterFormDialogProps {
  /** 'create' shows just the name field; 'edit' fetches by itemId and adds the is_active toggle. */
  mode: 'create' | 'edit'
  endpoint: string
  resourceKey: string
  labelSingular: string
  itemId?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Reused for both Kategori and Brand (FE-205) — the two resources are
 * identical shape (name + is_active), so one form covers create+edit for
 * either, driven entirely by the endpoint/label props.
 */
export function SimpleMasterFormDialog({
  mode,
  endpoint,
  resourceKey,
  labelSingular,
  itemId,
  open,
  onOpenChange,
}: SimpleMasterFormDialogProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [error, setError] = useState<string | undefined>()

  const itemQuery = useQuery({
    queryKey: [resourceKey, itemId],
    queryFn: () => api.get<LookupItem>(`${endpoint}/${itemId}`),
    enabled: open && mode === 'edit' && !!itemId,
    retry: false,
  })

  useEffect(() => {
    if (mode === 'edit' && itemQuery.data) {
      setName(itemQuery.data.name)
      setIsActive(itemQuery.data.is_active)
    }
  }, [mode, itemQuery.data])

  useEffect(() => {
    if (mode !== 'edit' || !itemQuery.isError) return
    showErrorToast(itemQuery.error, `${labelSingular} tidak ditemukan.`)
    queryClient.invalidateQueries({ queryKey: [resourceKey] })
    handleClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, itemQuery.isError])

  const saveMutation = useMutation({
    mutationFn: (payload: SimpleMasterPayload) =>
      mode === 'create'
        ? api.post<LookupItem, SimpleMasterPayload>(endpoint, payload)
        : api.put<LookupItem, SimpleMasterPayload>(`${endpoint}/${itemId}`, payload),
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: [resourceKey] })
      showSuccessToast(
        mode === 'create'
          ? `${labelSingular} "${item.name}" berhasil ditambahkan.`
          : `${labelSingular} "${item.name}" berhasil diperbarui.`,
      )
      handleClose()
    },
  })

  function handleClose() {
    setName('')
    setIsActive(true)
    setError(undefined)
    saveMutation.reset()
    onOpenChange(false)
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saveMutation.isPending) return

    if (!name.trim()) {
      setError(`Nama ${labelSingular.toLowerCase()} wajib diisi`)
      return
    }
    setError(undefined)

    saveMutation.mutate(
      mode === 'create' ? { name: name.trim() } : { name: name.trim(), is_active: isActive },
    )
  }

  // FE-205 AC: duplicate name (409, case-insensitive) shows inline on the
  // Nama field, not a generic banner/toast.
  const nameError =
    error ??
    (saveMutation.isError
      ? saveMutation.error instanceof ApiError
        ? saveMutation.error.message
        : 'Terjadi kesalahan, silakan coba lagi.'
      : undefined)

  const isPrefilling = mode === 'edit' && (itemQuery.isPending || !itemQuery.data)
  const isPending = saveMutation.isPending

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(next) : handleClose())}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? `Tambah ${labelSingular}` : `Edit ${labelSingular}`}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? `${labelSingular} baru untuk katalog produk.`
              : `Perbarui detail ${labelSingular.toLowerCase()}.`}
          </DialogDescription>
        </DialogHeader>

        {isPrefilling ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <FormField
              label="Nama"
              htmlFor="simple-master-name"
              required
              error={nameError}
              description={'Nama tidak membedakan huruf besar/kecil (mis. "Antam" dan "antam" dianggap sama).'}
            >
              <Input
                id="simple-master-name"
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isPending}
              />
            </FormField>

            {mode === 'edit' && (
              <>
                <p className="-mt-3 text-caption text-gray-500">
                  Mengubah nama tidak mengubah SKU produk yang sudah ada.
                </p>

                <div className="flex items-center justify-between rounded-md border border-border p-3">
                  <Label htmlFor="simple-master-active">Aktif</Label>
                  <Switch
                    id="simple-master-active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    disabled={isPending}
                  />
                </div>
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={handleClose} disabled={isPending}>
                Batal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="animate-spin" />}
                {isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
