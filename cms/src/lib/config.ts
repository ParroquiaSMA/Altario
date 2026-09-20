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
  tipo_cuenta: string
  numero_cuenta: string
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

export interface DonacionesConfig {
  mercadopago: {
    public_key: string
    access_token: string
    activo: boolean
    modo?: "sandbox" | "produccion"
    webhook_secret?: string
  }
  titulo_seccion: string
  mensaje: string
  cuentas_bancarias?: CuentaBancariaItem[]
  medios_donacion?: MedioDonacionItem[]
}

export interface HistoriaConfig {
  titulo: string
  bajada: string
  contenido_markdown: string
}

export interface SeoConfig {
  meta_titulo?: string
  titulo_sitio?: string
  meta_descripcion?: string
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

export const defaultSiteConfig: SiteConfig = {
  parroquia: {
    nombre: "",
    diocesis: "",
    lema: "",
    descripcion: "",
    logo_tipo: "monograma",
    logo_iniciales: "",
    logo_url: "",
  },
  parroco: {
    nombre: "",
    titulo: "",
    email: "",
    telefono: "",
    biografia: "",
    foto_url: "",
  },
  contacto: {
    direccion: "",
    telefono: "",
    whatsapp: "",
    email: "",
    horario_secretaria: "",
    como_llegar: "",
  },
  donaciones: {
    mercadopago: {
      public_key: "",
      access_token: "",
      activo: false,
    },
    titulo_seccion: "",
    mensaje: "",
    cuentas_bancarias: [],
    medios_donacion: [],
  },
  redes: {
    facebook: "",
    instagram: "",
    youtube: "",
    whatsapp: "",
    twitter: "",
    spotify: "",
  },
  historia: {
    titulo: "",
    bajada: "",
    contenido_markdown: "",
  },
  seo: {
    meta_titulo: "",
    meta_descripcion: "",
    palabras_clave: "",
    og_image_url: "",
  },
  apariencia: {
    color_primario: "#16244A",
    color_acento: "#C9A96A",
    color_fondo_hero: "",
    mostrar_banner_anuncio: false,
  },
  dominio: {
    dominio_web: "",
    subdominio_cms: "",
    forzar_https: true,
    proveedor_hosting: "vercel",
    google_analytics_id: "",
    google_search_console_id: "",
  },
}

let configMemory: SiteConfig | null = null

export function getLocalConfig(): SiteConfig {
  if (!configMemory) {
    configMemory = { ...defaultSiteConfig }
  }
  return configMemory
}

export function saveLocalConfig(config: SiteConfig): void {
  configMemory = config
}

export async function fetchSiteConfigFromDb(): Promise<SiteConfig> {
  const fallback = getLocalConfig()
  if (!supabase) return fallback

  try {
    const { data, error } = await supabase.from("configuracion").select("clave, valor")
    if (error || !data || data.length === 0) return fallback

    const configMap: Record<string, any> = {}
    data.forEach((row: any) => {
      configMap[row.clave] = row.valor
    })

    const merged: SiteConfig = {
      parroquia: configMap["parroquia"] ? { ...configMap["parroquia"] } : { ...defaultSiteConfig.parroquia },
      parroco: configMap["parroco"] ? { ...configMap["parroco"] } : { ...defaultSiteConfig.parroco },
      contacto: configMap["contacto"] ? { ...configMap["contacto"] } : { ...defaultSiteConfig.contacto },
      donaciones: configMap["donaciones"] ? { ...configMap["donaciones"] } : { ...defaultSiteConfig.donaciones },
      redes: configMap["redes"] ? { ...configMap["redes"] } : { ...defaultSiteConfig.redes },
      historia: configMap["historia"] ? { ...configMap["historia"] } : { ...defaultSiteConfig.historia },
      seo: configMap["seo"] ? { ...configMap["seo"] } : { ...defaultSiteConfig.seo },
      apariencia: configMap["apariencia"] ? { ...configMap["apariencia"] } : { ...defaultSiteConfig.apariencia },
      dominio: configMap["dominio"] ? { ...configMap["dominio"] } : { ...defaultSiteConfig.dominio },
    }

    saveLocalConfig(merged)
    return merged
  } catch {
    return fallback
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
