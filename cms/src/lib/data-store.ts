import { supabase } from "@/lib/supabase"
import seedHorarios from "@/data/seeds/horarios.json"
import seedAvisos from "@/data/seeds/avisos.json"
import seedFotos from "@/data/seeds/galeria.json"
import seedMensajes from "@/data/seeds/mensajes.json"

export interface HorarioItem {
  id: string
  dia_semana: number
  categoria: string
  hora_inicio: string
  hora_fin?: string | null
  titulo: string
  descripcion?: string
  lugar?: string
  activo: boolean
  orden?: number
}

export interface AvisoItem {
  id: string
  fecha: string
  titulo: string
  descripcion: string
  activo: boolean
  orden?: number
}

export interface FotoItem {
  id: string
  titulo: string
  categoria: string
  imagen_url: string
  descripcion?: string
  es_destacado: boolean
  activo: boolean
  orden?: number
}

export interface MensajeItem {
  id: string
  nombre: string
  correo: string
  telefono?: string
  motivo: string
  mensaje: string
  leido: boolean
  respondido: boolean
  created_at: string
}

function getStore<T>(key: string, seed: T[]): T[] {
  if (typeof window === "undefined") return seed
  try {
    const raw = localStorage.getItem(`altario:db:${key}`)
    if (!raw) {
      localStorage.setItem(`altario:db:${key}`, JSON.stringify(seed))
      return seed
    }
    return JSON.parse(raw) as T[]
  } catch {
    return seed
  }
}

function setStore<T>(key: string, items: T[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(`altario:db:${key}`, JSON.stringify(items))
}

// ──────────────────────────────────────────────
// HORARIOS
// ──────────────────────────────────────────────
export const getHorarios = (): HorarioItem[] => getStore<HorarioItem>("horarios", seedHorarios as HorarioItem[])
export const saveHorarios = (items: HorarioItem[]) => setStore("horarios", items)

export async function addHorario(item: Omit<HorarioItem, "id">): Promise<HorarioItem> {
  const nuevo = { ...item, id: `h-${Date.now()}` }
  if (supabase) {
    try {
      await supabase.from("horarios").insert([item])
    } catch (e) {
      console.warn("[DB] Error al insertar horario en Supabase:", e)
    }
  }
  const items = getHorarios()
  saveHorarios([nuevo, ...items])
  return nuevo
}

export async function updateHorario(id: string, updates: Partial<HorarioItem>): Promise<void> {
  if (supabase) {
    try {
      await supabase.from("horarios").update(updates).eq("id", id)
    } catch (e) {
      console.warn("[DB] Error al actualizar horario en Supabase:", e)
    }
  }
  const items = getHorarios()
  saveHorarios(items.map(i => i.id === id ? { ...i, ...updates } : i))
}

export async function deleteHorario(id: string): Promise<void> {
  if (supabase) {
    try {
      await supabase.from("horarios").delete().eq("id", id)
    } catch (e) {
      console.warn("[DB] Error al eliminar horario en Supabase:", e)
    }
  }
  saveHorarios(getHorarios().filter(i => i.id !== id))
}

// ──────────────────────────────────────────────
// AVISOS
// ──────────────────────────────────────────────
export const getAvisos = (): AvisoItem[] => getStore<AvisoItem>("avisos", seedAvisos as AvisoItem[])
export const saveAvisos = (items: AvisoItem[]) => setStore("avisos", items)

export async function addAviso(item: Omit<AvisoItem, "id">): Promise<AvisoItem> {
  const nuevo = { ...item, id: `a-${Date.now()}` }
  if (supabase) {
    try {
      await supabase.from("avisos").insert([item])
    } catch (e) {
      console.warn("[DB] Error al insertar aviso en Supabase:", e)
    }
  }
  const items = getAvisos()
  saveAvisos([nuevo, ...items])
  return nuevo
}

export async function updateAviso(id: string, updates: Partial<AvisoItem>): Promise<void> {
  if (supabase) {
    try {
      await supabase.from("avisos").update(updates).eq("id", id)
    } catch (e) {
      console.warn("[DB] Error al actualizar aviso en Supabase:", e)
    }
  }
  const items = getAvisos()
  saveAvisos(items.map(i => i.id === id ? { ...i, ...updates } : i))
}

export async function deleteAviso(id: string): Promise<void> {
  if (supabase) {
    try {
      await supabase.from("avisos").delete().eq("id", id)
    } catch (e) {
      console.warn("[DB] Error al eliminar aviso en Supabase:", e)
    }
  }
  saveAvisos(getAvisos().filter(i => i.id !== id))
}

// ──────────────────────────────────────────────
// FOTOS
// ──────────────────────────────────────────────
export const getFotos = (): FotoItem[] => getStore<FotoItem>("fotos", seedFotos as FotoItem[])
export const saveFotos = (items: FotoItem[]) => setStore("fotos", items)

export async function addFoto(item: Omit<FotoItem, "id">): Promise<FotoItem> {
  const nuevo = { ...item, id: `f-${Date.now()}` }
  if (supabase) {
    try {
      await supabase.from("galeria").insert([item])
    } catch (e) {
      console.warn("[DB] Error al insertar foto en Supabase:", e)
    }
  }
  const items = getFotos()
  saveFotos([nuevo, ...items])
  return nuevo
}

export async function updateFoto(id: string, updates: Partial<FotoItem>): Promise<void> {
  if (supabase) {
    try {
      await supabase.from("galeria").update(updates).eq("id", id)
    } catch (e) {
      console.warn("[DB] Error al actualizar foto en Supabase:", e)
    }
  }
  const items = getFotos()
  saveFotos(items.map(i => i.id === id ? { ...i, ...updates } : i))
}

export async function deleteFoto(id: string): Promise<void> {
  if (supabase) {
    try {
      await supabase.from("galeria").delete().eq("id", id)
    } catch (e) {
      console.warn("[DB] Error al eliminar foto en Supabase:", e)
    }
  }
  saveFotos(getFotos().filter(i => i.id !== id))
}

// ──────────────────────────────────────────────
// MENSAJES
// ──────────────────────────────────────────────
export const getMensajes = (): MensajeItem[] => getStore<MensajeItem>("mensajes", seedMensajes as MensajeItem[])
export const saveMensajes = (items: MensajeItem[]) => setStore("mensajes", items)

export async function updateMensaje(id: string, updates: Partial<MensajeItem>): Promise<void> {
  if (supabase) {
    try {
      await supabase.from("mensajes_contacto").update(updates).eq("id", id)
    } catch (e) {
      console.warn("[DB] Error al actualizar mensaje en Supabase:", e)
    }
  }
  const items = getMensajes()
  saveMensajes(items.map(i => i.id === id ? { ...i, ...updates } : i))
}

export async function deleteMensaje(id: string): Promise<void> {
  if (supabase) {
    try {
      await supabase.from("mensajes_contacto").delete().eq("id", id)
    } catch (e) {
      console.warn("[DB] Error al eliminar mensaje en Supabase:", e)
    }
  }
  saveMensajes(getMensajes().filter(i => i.id !== id))
}
