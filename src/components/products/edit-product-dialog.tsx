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
import {
  type ProductFormErrors,
  type ProductFormValues,
  validateProductForm,
} from '@/lib/product-validation'
import { showErrorToast, showSuccessToast } from '@/lib/toast'
import type { Product } from '@/types/product'

interface EditFormValues extends ProductFormValues {
  is_active: boolean
}

interface UpdateProductPayload {
  name: string
  category_id: string
  brand_id: string
  weight_gram: number
  description: string | null
  is_active: boolean
}

interface EditProductDialogProps {
  productId: string | null
  onClose: () => void
}

export function EditProductDialog({ productId, onClose }: EditProductDialogProps) {
  const queryClient = useQueryClient()
  const open = productId !== null
  const [values, setValues] = useState<EditFormValues | null>(null)
  const [errors, setErrors] = useState<ProductFormErrors>({})

  const { categories, brands, isLoading: lookupsLoading } = useProductLookups(open)

  const productQuery = useQuery({
    queryKey: ['products', productId],
    queryFn: () => api.get<Product>(`/products/${productId}`),
    enabled: open,
    retry: false,
  })

  useEffect(() => {
    if (productQuery.data) {
      setValues({
        name: productQuery.data.name,
        category_id: productQuery.data.category.id,
        brand_id: productQuery.data.brand.id,
        weight_gram: String(productQuery.data.weight_gram),
        description: productQuery.data.description ?? '',
        is_active: productQuery.data.is_active,
      })
    }
  }, [productQuery.data])

  useEffect(() => {
    if (!productQuery.isError) return
    showErrorToast(productQuery.error, 'Produk tidak ditemukan.')
    queryClient.invalidateQueries({ queryKey: ['products'] })
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productQuery.isError])

  const updateProductMutation = useMutation({
    mutationFn: (payload: UpdateProductPayload) =>
      api.put<Product, UpdateProductPayload>(`/products/${productId}`, payload),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      showSuccessToast(`Produk "${product.name}" berhasil diperbarui.`)
      handleClose()
    },
  })

  function handleClose() {
    setValues(null)
    setErrors({})
    updateProductMutation.reset()
    onClose()
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!values || updateProductMutation.isPending) return

    const validationErrors = validateProductForm(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    updateProductMutation.mutate({
      name: values.name.trim(),
      category_id: values.category_id,
      brand_id: values.brand_id,
      weight_gram: Number(values.weight_gram),
      description: values.description.trim() || null,
      is_active: values.is_active,
    })
  }

  const submitErrorMessage = updateProductMutation.isError
    ? updateProductMutation.error instanceof ApiError
      ? updateProductMutation.error.message
      : 'Terjadi kesalahan, silakan coba lagi.'
    : null

  const isPrefilling = productQuery.isPending || values === null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Produk</DialogTitle>
          <DialogDescription>Perbarui detail produk.</DialogDescription>
        </DialogHeader>

        {isPrefilling ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <FormField label="SKU" htmlFor="edit-product-sku">
              <Input
                id="edit-product-sku"
                value={productQuery.data?.sku ?? ''}
                disabled
                readOnly
              />
            </FormField>

            <FormField
              label="Nama Produk"
              htmlFor="edit-product-name"
              required
              error={errors.name}
            >
              <Input
                id="edit-product-name"
                value={values.name}
                onChange={(event) =>
                  setValues((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                }
                disabled={updateProductMutation.isPending}
              />
            </FormField>

            <FormField
              label="Kategori"
              htmlFor="edit-product-category"
              required
              error={errors.category_id}
            >
              <Select
                value={values.category_id}
                onValueChange={(value) =>
                  setValues((prev) => (prev ? { ...prev, category_id: value } : prev))
                }
                disabled={updateProductMutation.isPending || lookupsLoading}
              >
                <SelectTrigger id="edit-product-category" className="w-full">
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

            <FormField
              label="Brand"
              htmlFor="edit-product-brand"
              required
              error={errors.brand_id}
            >
              <Select
                value={values.brand_id}
                onValueChange={(value) =>
                  setValues((prev) => (prev ? { ...prev, brand_id: value } : prev))
                }
                disabled={updateProductMutation.isPending || lookupsLoading}
              >
                <SelectTrigger id="edit-product-brand" className="w-full">
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
              htmlFor="edit-product-weight"
              required
              error={errors.weight_gram}
            >
              <Input
                id="edit-product-weight"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={values.weight_gram}
                onChange={(event) =>
                  setValues((prev) =>
                    prev ? { ...prev, weight_gram: event.target.value } : prev,
                  )
                }
                disabled={updateProductMutation.isPending}
              />
            </FormField>

            <FormField label="Deskripsi" htmlFor="edit-product-description" description="Opsional">
              <Textarea
                id="edit-product-description"
                value={values.description}
                onChange={(event) =>
                  setValues((prev) =>
                    prev ? { ...prev, description: event.target.value } : prev,
                  )
                }
                disabled={updateProductMutation.isPending}
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
                disabled={updateProductMutation.isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={updateProductMutation.isPending}>
                {updateProductMutation.isPending && <Loader2 className="animate-spin" />}
                {updateProductMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
