export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  role: string | null
  created_at: string
}

export interface Property {
  id: string
  agent_id: string
  title: string
  description: string | null
  price: number
  type: string
  category: string
  bedrooms: number
  bathrooms: number
  area_sqft: number
  city: string
  location: string | null
  is_featured: boolean
  status: string
  created_at: string
}

export interface PropertyImage {
  id: string
  property_id: string
  storage_path: string
  is_cover: boolean
  created_at: string
}
