import { supabase } from "@/lib/supabase"
import seedCatalogos from "@/data/seeds/catalogos.json"

export type CatalogName = "tipos_horario" | "categorias_galeria" | "lugares" | "motivos_contacto"

export interface CatalogOption {
  id: string
  nombre: string
  codigo: string
  descripcion?: string
  activo: boolean
}

export interface CatalogMeta {
  id: CatalogName
  titulo: string
  descripcion: string
  ejemploUso: string
}

export const CATALOG_DEFINITIONS: CatalogMeta[] = [
  {
    id: "tipos_horario",
    titulo: "Tipos de Celebración",
    descripcion: "Opciones disponibles en el select 'Tipo' al crear o editar horarios y misas.",
    ejemploUso: "Usado en: Horarios (Misas, Confesiones, etc.)",
  },
  {
    id: "categorias_galeria",
    titulo: "Categorías de Galería",
    descripcion: "Opciones disponibles en el select 'Categoría' al subir fotos a la galería.",
    ejemploUso: "Usado en: Galería de fotos",
  },
  {
    id: "lugares",
    titulo: "Lugares del Templo",
    descripcion: "Espacios físicos y capillas disponibles al agendar actividades.",
    ejemploUso: "Usado en: Horarios (Iglesia Principal, Capilla, etc.)",
  },
  {
    id: "motivos_contacto",
    titulo: "Motivos de Contacto",
    descripcion: "Categorías de trámites y motivos para consultas recibidas por feligreses.",
    ejemploUso: "Usado en: Mensajes y Formulario web",
  },
]

function storageKey(name: CatalogName) {
  return `altario:db:catalog:${name}`
}

function getLocalSeed(name: CatalogName): CatalogOption[] {
  const seeds = seedCatalogos as Record<string, CatalogOption[]>
  return seeds[name] || []
}

const catalogMemory: Record<string, CatalogOption[]> = {}

/** Obtiene los ítems del catálogo desde memoria o seed */
export function getCatalog(name: CatalogName): CatalogOption[] {
  if (!catalogMemory[name]) {
    catalogMemory[name] = getLocalSeed(name)
  }
  return catalogMemory[name]
}

/** Consulta asíncrona hacia Supabase con fallback reactivo */
export async function fetchCatalogFromDb(name: CatalogName): Promise<CatalogOption[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("catalogos")
        .select("id, nombre, codigo, descripcion, activo")
        .eq("catalogo", name)
        .order("orden", { ascending: true })

      if (!error && data) {
        setCatalog(name, data as CatalogOption[])
        return data as CatalogOption[]
      }
    } catch (e) {
      console.warn(`[DB] Error al consultar catálogo ${name} en Supabase:`, e)
    }
  }
  return getCatalog(name)
}

/** Obtiene solo las opciones activas para poblar selects */
export function getActiveCatalogOptions(name: CatalogName): CatalogOption[] {
  return getCatalog(name).filter((item) => item.activo)
}

/** Guarda la colección completa en memoria */
export function setCatalog(name: CatalogName, items: CatalogOption[]): void {
  catalogMemory[name] = items
}

/** Agrega una nueva opción */
export async function addCatalogItem(
  name: CatalogName,
  item: Omit<CatalogOption, "id">
): Promise<CatalogOption> {
  const nuevo: CatalogOption = {
    ...item,
    id: `${name.substring(0, 2)}-${Date.now()}`,
  }

  // Persistir en Supabase si está disponible
  if (supabase) {
    try {
      await supabase.from("catalogos").insert([
        {
          catalogo: name,
          nombre: item.nombre,
          codigo: item.codigo,
          descripcion: item.descripcion,
          activo: item.activo,
        },
      ])
    } catch (e) {
      console.warn(`[DB] No se pudo guardar en Supabase:`, e)
    }
  }

  const items = getCatalog(name)
  setCatalog(name, [nuevo, ...items])
  return nuevo
}

/** Actualiza una opción */
export async function updateCatalogItem(
  name: CatalogName,
  id: string,
  updates: Partial<Omit<CatalogOption, "id">>
): Promise<void> {
  if (supabase) {
    try {
      await supabase.from("catalogos").update(updates).eq("id", id)
    } catch (e) {
      console.warn(`[DB] No se pudo actualizar en Supabase:`, e)
    }
  }

  const items = getCatalog(name)
  setCatalog(
    name,
    items.map((item) => (item.id === id ? { ...item, ...updates } : item))
  )
}

/** Elimina una opción */
export async function deleteCatalogItem(name: CatalogName, id: string): Promise<void> {
  if (supabase) {
    try {
      await supabase.from("catalogos").delete().eq("id", id)
    } catch (e) {
      console.warn(`[DB] No se pudo eliminar en Supabase:`, e)
    }
  }

  const items = getCatalog(name)
  setCatalog(name, items.filter((item) => item.id !== id))
}

/** Restablece a los valores del archivo seed */
export function resetCatalog(name: CatalogName): void {
  catalogMemory[name] = getLocalSeed(name)
}
