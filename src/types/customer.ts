export interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  id_type: string | null
  id_number: string | null
  address: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}
