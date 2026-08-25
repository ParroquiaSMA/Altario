import seedConfig from "@/data/seeds/configuracion.json"
import { supabase } from "@/lib/supabase"

export interface ParroquiaConfig {
  nombre: string
  diocesis: string
  lema: string
  descripcion: string
  logo_tipo: "monograma" | "imagen"
  logo_iniciales: string
  logo_url: string
}

export interface ParrocoConfig {
  nombre: string
  titulo: string
  email: string
  telefono: string
  biografia: string
  foto_url: string
}

export interface ContactoConfig {
  direccion: string
  telefono: string
  whatsapp: string
  email: string
  horario_secretaria: string
  como_llegar: string
}

export interface RedesConfig {
  facebook: string
  instagram: string
  youtube: string
  whatsapp: string
  twitter: string
  spotify: string
}

export interface AparienciaConfig {
  color_primario: string
  color_acento: string
  color_fondo_hero: string
  mostrar_banner_anuncio: boolean
}

export interface SiteConfig {
  parroquia: ParroquiaConfig
  parroco: ParrocoConfig
  contacto: ContactoConfig
  redes: RedesConfig
  apariencia: AparienciaConfig
}

const CONFIG_STORAGE_KEY = "altario:cms:site_config:v1"

export function getLocalConfig(): SiteConfig {
  if (typeof window === "undefined") return seedConfig as SiteConfig
  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY)
    if (!stored) {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(seedConfig))
      return seedConfig as SiteConfig
    }
    const parsed = JSON.parse(stored) as Partial<SiteConfig>
    return {
      parroquia: { ...seedConfig.parroquia, ...(parsed.parroquia || {}) },
      parroco: { ...seedConfig.parroco, ...(parsed.parroco || {}) },
      contacto: { ...seedConfig.contacto, ...(parsed.contacto || {}) },
      redes: { ...seedConfig.redes, ...(parsed.redes || {}) },
      apariencia: { ...seedConfig.apariencia, ...(parsed.apariencia || {}) },
    } as SiteConfig
  } catch {
    return seedConfig as SiteConfig
  }
}

export function saveLocalConfig(config: SiteConfig): void {
  if (typeof window === "undefined") return
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config))
}

export async function fetchSiteConfigFromDb(): Promise<SiteConfig> {
  const local = getLocalConfig()
  if (!supabase) return local

  try {
    const { data, error } = await supabase.from("configuracion").select("clave, valor")
    if (error || !data || data.length === 0) return local

    const configMap: Record<string, any> = {}
    data.forEach((row) => {
      configMap[row.clave] = row.valor
    })

    const merged: SiteConfig = {
      parroquia: { ...local.parroquia, ...(configMap["parroquia"] || {}) },
      parroco: { ...local.parroco, ...(configMap["parroco"] || {}) },
      contacto: { ...local.contacto, ...(configMap["contacto"] || {}) },
      redes: { ...local.redes, ...(configMap["redes"] || {}) },
      apariencia: { ...local.apariencia, ...(configMap["apariencia"] || {}) },
    }

    saveLocalConfig(merged)
    return merged
  } catch {
    return local
  }
}

export async function saveSiteConfigSection<K extends keyof SiteConfig>(
  section: K,
  value: SiteConfig[K]
): Promise<void> {
  const current = getLocalConfig()
  const updated: SiteConfig = {
    ...current,
    [section]: value,
  }

  await saveFullSiteConfig(updated)
}

export async function saveFullSiteConfig(config: SiteConfig): Promise<void> {
  saveLocalConfig(config)

  // 1. Sync to local files via API endpoint (allows web dev server to see changes immediately)
  try {
    if (typeof window !== "undefined") {
      await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
    }
  } catch (err) {
    console.warn("No se pudo persistir en API local:", err)
  }

  // 2. Sync to Supabase if connected
  if (supabase) {
    const sections: (keyof SiteConfig)[] = ["parroquia", "parroco", "contacto", "redes", "apariencia"]
    try {
      const updates = sections.map((sec) => ({
        clave: sec,
        valor: config[sec],
        actualizado_en: new Date().toISOString(),
      }))
      await supabase.from("configuracion").upsert(updates, { onConflict: "clave" })
    } catch (err) {
      console.warn("Error al sincronizar configuración con Supabase:", err)
    }
  }
}
