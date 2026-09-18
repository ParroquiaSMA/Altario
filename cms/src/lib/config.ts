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

export interface DominioConfig {
  dominio_web: string
  subdominio_cms: string
  forzar_https: boolean
  proveedor_hosting: "vercel" | "cloudflare" | "netlify" | "custom"
  google_analytics_id: string
  google_search_console_id: string
}

export interface CuentaBancariaItem {
  id: string
  banco: string
  titular: string
  numero_cuenta: string
  tipo_cuenta: string
  identificacion_fiscal?: string
  referencia?: string
  activo?: boolean
}

export interface MedioDonacionItem {
  id: string
  titulo: string
  descripcion: string
  enlace?: string
  etiqueta_boton?: string
  activo?: boolean
}

export interface MercadoPagoConfig {
  activo: boolean
  modo: "sandbox" | "produccion"
  public_key: string
  access_token: string
}

export interface DonacionesConfig {
  titulo_seccion?: string
  mensaje?: string
  mercadopago?: MercadoPagoConfig
  cuentas_bancarias: CuentaBancariaItem[]
  medios_donacion: MedioDonacionItem[]
}

export interface HistoriaConfig {
  titulo: string
  bajada?: string
  contenido_markdown: string
}

export interface SeoConfig {
  titulo_sitio?: string
  descripcion?: string
  og_image_url?: string
  favicon_url?: string
  palabras_clave?: string
}

export interface SiteConfig {
  parroquia: ParroquiaConfig
  parroco: ParrocoConfig
  contacto: ContactoConfig
  donaciones: DonacionesConfig
  redes: RedesConfig
  historia: HistoriaConfig
  seo: SeoConfig
  apariencia: AparienciaConfig
  dominio: DominioConfig
}

let configMemory: SiteConfig | null = null

export function getLocalConfig(): SiteConfig {
  if (!configMemory) {
    configMemory = seedConfig as unknown as SiteConfig
  }
  return configMemory
}

export function saveLocalConfig(config: SiteConfig): void {
  configMemory = config
}

export async function fetchSiteConfigFromDb(): Promise<SiteConfig> {
  const local = getLocalConfig()
  if (!supabase) return local

  try {
    const { data, error } = await supabase.from("configuracion").select("clave, valor")
    if (error || !data || data.length === 0) return local

    const configMap: Record<string, any> = {}
    data.forEach((row: any) => {
      configMap[row.clave] = row.valor
    })

    const merged: SiteConfig = {
      parroquia: { ...local.parroquia, ...(configMap["parroquia"] || {}) },
      parroco: { ...local.parroco, ...(configMap["parroco"] || {}) },
      contacto: { ...local.contacto, ...(configMap["contacto"] || {}) },
      donaciones: { ...local.donaciones, ...(configMap["donaciones"] || {}) },
      redes: { ...local.redes, ...(configMap["redes"] || {}) },
      historia: { ...local.historia, ...(configMap["historia"] || {}) },
      seo: { ...local.seo, ...(configMap["seo"] || {}) },
      apariencia: { ...local.apariencia, ...(configMap["apariencia"] || {}) },
      dominio: { ...local.dominio, ...(configMap["dominio"] || {}) },
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

  // 2. Broadcast live event to open web pages
  try {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel("altario:site_config_sync")
      bc.postMessage({ type: "CONFIG_UPDATED", config })
      bc.close()
    }
  } catch {}

  // 3. Sync to Supabase if connected
  if (supabase) {
    const sections: (keyof SiteConfig)[] = [
      "parroquia",
      "parroco",
      "contacto",
      "donaciones",
      "redes",
      "historia",
      "seo",
      "apariencia",
      "dominio",
    ]
    try {
      const updates = sections.map((sec) => ({
        clave: sec,
        valor: config[sec],
        updated_at: new Date().toISOString(),
      }))
      await supabase.from("configuracion").upsert(updates, { onConflict: "clave" })
    } catch (err) {
      console.warn("Error al sincronizar configuración con Supabase:", err)
    }
  }
}
