/** Shape shared by small reference/lookup lists (categories, brands, ...). */
export interface LookupItem {
  id: string
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
}
