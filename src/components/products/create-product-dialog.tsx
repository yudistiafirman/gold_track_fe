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
import { Textarea } from '@/components/ui/textarea'
import { useProductLookups } from '@/hooks/use-product-lookups'
import { api } from '@/lib/api/client'
import { ApiError } from '@/lib/api/error'
import { type ProductFormValues, validateProductForm } from '@/lib/product-validation'
import { showSuccessToast } from '@/lib/toast'
import type { Product } from '@/types/product'

interface CreateProductPayload {
  name: string
  category_id: string
  brand_id: string
  weight_gram: number
  description: string | null
}

const INITIAL_VALUES: ProductFormValues = {
  name: '',
  category_id: '',
  brand_id: '',
  weight_gram: '',
  description: '',
}

interface CreateProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProductDialog({ open, onOpenChange }: CreateProductDialogProps) {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<ProductFormValues>(INITIAL_VALUES)
  const [errors, setErrors] = useState<ReturnType<typeof validateProductForm>>({})

  const { categories, brands, isLoading: lookupsLoading } = useProductLookups(open)

  const createProductMutation = useMutation({
    mutationFn: (payload: CreateProductPayload) =>
      api.post<Product, CreateProductPayload>('/products', payload),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      showSuccessToast(`Produk berhasil ditambahkan. SKU: ${product.sku}`)
      handleClose()
    },
  })

  function handleClose() {
    setValues(INITIAL_VALUES)
    setErrors({})
    createProductMutation.reset()
    onOpenChange(false)
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (createProductMutation.isPending) return

    const validationErrors = validateProductForm(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    createProductMutation.mutate({
      name: values.name.trim(),
      category_id: values.category_id,
      brand_id: values.brand_id,
      weight_gram: Number(values.weight_gram),
      description: values.description.trim() || null,
    })
  }

  const submitErrorMessage = createProductMutation.isError
    ? createProductMutation.error instanceof ApiError
      ? createProductMutation.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : null

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(next) : handleClose())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Produk</DialogTitle>
          <DialogDescription>
            Isi detail produk baru. SKU akan digenerate otomatis.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <FormField label="Nama Produk" htmlFor="product-name" required error={errors.name}>
            <Input
              id="product-name"
              value={values.name}
              onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
              disabled={createProductMutation.isPending}
            />
          </FormField>

          <FormField
            label="Kategori"
            htmlFor="product-category"
            required
            error={errors.category_id}
          >
            <Select
              value={values.category_id}
              onValueChange={(value) => setValues((prev) => ({ ...prev, category_id: value }))}
              disabled={createProductMutation.isPending || lookupsLoading}
            >
              <SelectTrigger id="product-category" className="w-full">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Brand" htmlFor="product-brand" required error={errors.brand_id}>
            <Select
              value={values.brand_id}
              onValueChange={(value) => setValues((prev) => ({ ...prev, brand_id: value }))}
              disabled={createProductMutation.isPending || lookupsLoading}
            >
              <SelectTrigger id="product-brand" className="w-full">
                <SelectValue placeholder="Pilih brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label="Berat (gram)"
            htmlFor="product-weight"
            required
            error={errors.weight_gram}
          >
            <Input
              id="product-weight"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={values.weight_gram}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, weight_gram: event.target.value }))
              }
              disabled={createProductMutation.isPending}
            />
          </FormField>

          <FormField label="Deskripsi" htmlFor="product-description" description="Opsional">
            <Textarea
              id="product-description"
              value={values.description}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, description: event.target.value }))
              }
              disabled={createProductMutation.isPending}
            />
          </FormField>

          {submitErrorMessage && (
            <p
              role="alert"
              className="rounded-sm border border-error/30 bg-error/10 px-3 py-2 text-caption text-error"
            >
              {submitErrorMessage}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={createProductMutation.isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={createProductMutation.isPending}>
              {createProductMutation.isPending && <Loader2 className="animate-spin" />}
              {createProductMutation.isPending ? 'Menyimpan...' : 'Simpan Produk'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
