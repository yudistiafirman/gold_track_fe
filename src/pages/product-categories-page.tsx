import { SimpleMasterList } from '@/components/simple-master-list'

export function ProductCategoriesPage() {
  return <SimpleMasterList resourceKey="categories" endpoint="/categories" labelSingular="Kategori" />
}
