import { supabase } from "@/lib/supabase"

/**
 * Uploads a file to Supabase Storage ('media' bucket) and returns its public URL.
 * If Supabase is not connected, falls back to a base64 Data URL for local preview.
 */

export async function uploadMediaFile(
  file: File,
  folder: "logos" | "parroco" | "galeria" | "general" = "general"
): Promise<string> {
  const fileExt = file.name.split(".").pop() || "jpg"
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`

  if (supabase) {
    try {
      const { data, error } = await supabase.storage.from("media").upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      })

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage.from("media").getPublicUrl(fileName)
        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl
        }
      }
    } catch (err) {
      console.warn("Error uploading to Supabase Storage, using Data URL fallback:", err)
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
