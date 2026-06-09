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

export interface Inquiry {
  id: string
  property_id: string
  user_id: string
  agent_id: string
  inquiry_type: "buy" | "rent" | "viewing"
  message: string | null
  phone: string | null
  status: "new" | "contacted" | "closed"
  created_at: string
}

export interface SavedProperty {
  id: string
  user_id: string
  property_id: string
  created_at: string
}
