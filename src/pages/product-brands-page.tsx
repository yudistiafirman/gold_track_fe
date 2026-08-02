import { SimpleMasterList } from '@/components/simple-master-list'

export function ProductBrandsPage() {
  return <SimpleMasterList resourceKey="brands" endpoint="/brands" labelSingular="Brand" />
}
