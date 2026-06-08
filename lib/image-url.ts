import { supabase } from "@/lib/supabase"

export function getImageUrl(storage_path: string | null): string | null {
  if (!storage_path) return null
  if (storage_path.startsWith("http")) return storage_path
  const { data } = supabase.storage.from("property-images").getPublicUrl(storage_path)
  return data.publicUrl
}
