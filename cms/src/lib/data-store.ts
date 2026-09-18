import { supabase } from "@/lib/supabase"
import seedHorarios from "@/data/seeds/horarios.json"
import seedAvisos from "@/data/seeds/avisos.json"
import seedFotos from "@/data/seeds/galeria.json"
import seedMensajes from "@/data/seeds/mensajes.json"
import seedSacramentos from "@/data/seeds/sacramentos.json"
import seedGrupos from "@/data/seeds/grupos.json"
import seedDonaciones from "@/data/seeds/donaciones.json"

export interface HorarioItem {
  id: string
  dia_semana: number
  dias_semana?: number[]
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

export interface SacramentoItem {
  id: string
  slug: string
  titulo: string
  descripcion: string
  requisitos: string
  categoria: string
  orden?: number
}

export interface GrupoItem {
  id: string
  nombre: string
  descripcion: string
  horario_encuentro: string
  orden?: number
}

export interface MensajeItem {
  id: string
  nombre: string
  correo: string
  telefono?: string
  motivo: string
  mensaje: string
  canal_preferido?: string
  leido: boolean
  respondido: boolean
  created_at: string
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function getItemSignature(key: string, item: any): string {
  if (!item) return ""
  if (key === "horarios" && item.titulo) {
    return `${item.dia_semana}_${item.hora_inicio}_${String(item.titulo).trim().toLowerCase()}`
  }
  if (key === "avisos" && item.titulo) {
    return `${String(item.titulo).trim().toLowerCase()}_${item.fecha || ""}`
  }
  if ((key === "fotos" || key === "galeria") && (item.imagen_url || item.titulo)) {
    return `${item.imagen_url || ""}_${String(item.titulo || "").trim().toLowerCase()}`
  }
  if (key === "sacramentos" && (item.slug || item.titulo)) {
    return String(item.slug || item.titulo).trim().toLowerCase()
  }
  if (key === "grupos" && item.nombre) {
    return String(item.nombre).trim().toLowerCase()
  }
  if (key === "donaciones") {
    return String(item.mp_payment_id || item.id || "")
  }
  if (key === "mensajes") {
    return item.id ? String(item.id) : `${item.correo || ""}_${item.created_at || ""}`
  }
  return String(item.id || item.slug || "")
}

function deduplicateItems<T>(key: string, items: T[]): T[] {
  if (!Array.isArray(items) || items.length <= 1) return items
  const map = new Map<string, any>()

  for (const item of items as any[]) {
    if (!item) continue
    const sig = getItemSignature(key, item)
    if (!sig) {
      map.set(`fallback_${Math.random()}`, item)
      continue
    }

    if (!map.has(sig)) {
      map.set(sig, item)
    } else {
      const current = map.get(sig)
      const currentIsUuid = UUID_REGEX.test(String(current?.id || ""))
      const itemIsUuid = UUID_REGEX.test(String(item?.id || ""))
      // Prefer real Supabase UUID over mock seed ID (e.g. h-001)
      if (!currentIsUuid && itemIsUuid) {
        map.set(sig, item)
      }
    }
  }

  return Array.from(map.values()) as T[]
}

// Memoria en tiempo de ejecución (sin localStorage para evitar duplicaciones y estados desfasados)
const inMemoryStores: Record<string, any[]> = {
  horarios: seedHorarios,
  avisos: seedAvisos,
  sacramentos: seedSacramentos,
  grupos: seedGrupos,
  galeria: seedFotos,
  mensajes: seedMensajes,
}

function getStore<T>(key: string, seed: T[]): T[] {
  if (inMemoryStores[key]) {
    return inMemoryStores[key] as T[]
  }
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(`altario_store_${key}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryStores[key] = deduplicateItems<T>(key, parsed)
          return inMemoryStores[key] as T[]
        }
      }
    } catch {}
  }
  inMemoryStores[key] = deduplicateItems<T>(key, seed)
  return inMemoryStores[key] as T[]
}

function setStore<T>(key: string, items: T[]): void {
  const deduped = deduplicateItems<T>(key, items)
  inMemoryStores[key] = deduped
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`altario_store_${key}`, JSON.stringify(deduped))
    } catch {}
  }
}

function syncStoreToFiles(store: string, data: any): void {
  if (typeof window === "undefined") return
  // Solo sincronizar a archivos en entorno local de desarrollo (Vite middleware)
  if (!window.location.hostname.includes("localhost") && !window.location.hostname.includes("127.0.0.1")) {
    return
  }
  fetch("/api/sync-store", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ store, data }),
  }).catch(() => {})
}

// ──────────────────────────────────────────────
// HORARIOS
// ──────────────────────────────────────────────
export const getHorarios = (): HorarioItem[] => getStore<HorarioItem>("horarios", seedHorarios as HorarioItem[])
export const saveHorarios = (items: HorarioItem[]) => setStore("horarios", items)

export async function fetchHorariosFromDb(): Promise<HorarioItem[]> {
  const local = getHorarios()
  if (!supabase) return local
  try {
    const { data, error } = await supabase.from("horarios").select("*").order("orden", { ascending: true })
    if (error || !data) return local
    saveHorarios(data as HorarioItem[])
    return data as HorarioItem[]
  } catch {
    return local
  }
}

export async function addHorario(item: Omit<HorarioItem, "id">): Promise<HorarioItem> {
  if (!supabase) {
    throw new Error("No hay conexión con la base de datos (Supabase no configurado).")
  }
  const { data, error } = await supabase.from("horarios").insert([item]).select()
  if (error) {
    const { dias_semana, ...fallbackItem } = item as any
    const { data: fbData, error: fbError } = await supabase.from("horarios").insert([fallbackItem]).select()
    if (fbError || !fbData?.[0]) {
      console.error("[DB] Error al insertar horario en Supabase:", fbError || error)
      throw new Error((fbError || error).message || "Error al insertar horario en la base de datos")
    }
    const nuevo = fbData[0] as HorarioItem
    const items = getHorarios()
    const updated = [nuevo, ...items.filter(i => i.id !== nuevo.id)]
    saveHorarios(updated)
    syncStoreToFiles("horarios", updated)
    return nuevo
  }
  if (!data?.[0]) {
    throw new Error("La base de datos no devolvió el registro insertado.")
  }
  const nuevo = data[0] as HorarioItem
  const items = getHorarios()
  const updated = [nuevo, ...items.filter(i => i.id !== nuevo.id)]
  saveHorarios(updated)
  syncStoreToFiles("horarios", updated)
  return nuevo
}

export async function updateHorario(id: string, updates: Partial<HorarioItem>): Promise<void> {
  if (!supabase) throw new Error("No hay conexión con la base de datos (Supabase no configurado).")
  const { error } = await supabase.from("horarios").update(updates).eq("id", id)
  if (error) {
    const { dias_semana, ...fallbackUpdates } = updates as any
    const { error: fbError } = await supabase.from("horarios").update(fallbackUpdates).eq("id", id)
    if (fbError) {
      console.error("[DB] Error al actualizar horario en Supabase:", fbError)
      throw new Error(fbError.message)
    }
  }
  const items = getHorarios()
  const updated = items.map(i => (i.id === id ? { ...i, ...updates } : i))
  saveHorarios(updated)
  syncStoreToFiles("horarios", updated)
}

export async function deleteHorario(id: string): Promise<void> {
  if (!supabase) throw new Error("No hay conexión con la base de datos (Supabase no configurado).")
  const { error } = await supabase.from("horarios").delete().eq("id", id)
  if (error) {
    console.error("[DB] Error al eliminar horario en Supabase:", error)
    throw new Error(error.message)
  }
  const updated = getHorarios().filter(i => i.id !== id)
  saveHorarios(updated)
  syncStoreToFiles("horarios", updated)
}

export async function deleteHorarios(ids: string[]): Promise<void> {
  if (!ids || ids.length === 0) return
  if (!supabase) throw new Error("No hay conexión con la base de datos (Supabase no configurado).")
  const { error } = await supabase.from("horarios").delete().in("id", ids)
  if (error) {
    console.error("[DB] Error al eliminar horarios en Supabase:", error)
    throw new Error(error.message)
  }
  const idSet = new Set(ids)
  const updated = getHorarios().filter(i => !idSet.has(i.id))
  saveHorarios(updated)
  syncStoreToFiles("horarios", updated)
}

// ──────────────────────────────────────────────
// AVISOS
// ──────────────────────────────────────────────
export const getAvisos = (): AvisoItem[] => getStore<AvisoItem>("avisos", seedAvisos as AvisoItem[])
export const saveAvisos = (items: AvisoItem[]) => setStore("avisos", items)

export async function fetchAvisosFromDb(): Promise<AvisoItem[]> {
  const local = getAvisos()
  if (!supabase) return local
  try {
    const { data, error } = await supabase.from("avisos").select("*").order("fecha", { ascending: true })
    if (error || !data) return local
    saveAvisos(data as AvisoItem[])
    return data as AvisoItem[]
  } catch {
    return local
  }
}

export async function addAviso(item: Omit<AvisoItem, "id">): Promise<AvisoItem> {
  if (!supabase) throw new Error("No hay conexión con la base de datos (Supabase no configurado).")
  const { data, error } = await supabase.from("avisos").insert([item]).select()
  if (error || !data?.[0]) {
    console.error("[DB] Error al insertar aviso en Supabase:", error)
    throw new Error(error?.message || "Error al insertar aviso en la base de datos")
  }
  const nuevo = data[0] as AvisoItem
  const items = getAvisos()
  const updated = [nuevo, ...items.filter(i => i.id !== nuevo.id)]
  saveAvisos(updated)
  syncStoreToFiles("avisos", updated)
  return nuevo
}

export async function updateAviso(id: string, updates: Partial<AvisoItem>): Promise<void> {
  if (!supabase) throw new Error("No hay conexión con la base de datos (Supabase no configurado).")
  const { error } = await supabase.from("avisos").update(updates).eq("id", id)
  if (error) {
    console.error("[DB] Error al actualizar aviso en Supabase:", error)
    throw new Error(error.message)
  }
  const items = getAvisos()
  const updated = items.map(i => (i.id === id ? { ...i, ...updates } : i))
  saveAvisos(updated)
  syncStoreToFiles("avisos", updated)
}

export async function deleteAviso(id: string): Promise<void> {
  if (!supabase) throw new Error("No hay conexión con la base de datos (Supabase no configurado).")
  const { error } = await supabase.from("avisos").delete().eq("id", id)
  if (error) {
    console.error("[DB] Error al eliminar aviso en Supabase:", error)
    throw new Error(error.message)
  }
  const updated = getAvisos().filter(i => i.id !== id)
  saveAvisos(updated)
  syncStoreToFiles("avisos", updated)
}

// ──────────────────────────────────────────────
// FOTOS / GALERÍA
// ──────────────────────────────────────────────
export const getFotos = (): FotoItem[] => getStore<FotoItem>("fotos", seedFotos as FotoItem[])
export const saveFotos = (items: FotoItem[]) => setStore("fotos", items)

export async function fetchFotosFromDb(): Promise<FotoItem[]> {
  const local = getFotos()
  if (!supabase) return local

  try {
    const { data, error } = await supabase.from("galeria").select("*").order("orden", { ascending: true })
    if (error || !data) return local

    const mapped: FotoItem[] = data.map((d: any) => ({
      id: d.id,
      titulo: d.titulo,
      categoria: d.categoria,
      imagen_url: d.imagen_url,
      descripcion: d.descripcion || "",
      es_destacado: Boolean(d.es_destacado),
      activo: Boolean(d.activo),
      orden: d.orden ?? 0,
    }))

    saveFotos(mapped)
    return mapped
  } catch {
    return local
  }
}

export async function addFoto(item: Omit<FotoItem, "id">): Promise<FotoItem> {
  if (!supabase) throw new Error("No hay conexión con la base de datos (Supabase no configurado).")
  const { data, error } = await supabase
    .from("galeria")
    .insert([{
      titulo: item.titulo,
      categoria: item.categoria,
      descripcion: item.descripcion || null,
      imagen_url: item.imagen_url,
      es_destacado: item.es_destacado ?? false,
      activo: item.activo ?? true,
      orden: item.orden ?? 0,
    }])
    .select()

  if (error || !data?.[0]) {
    console.error("[DB] Error al insertar foto en Supabase:", error)
    throw new Error(error?.message || "Error al insertar foto en la base de datos")
  }

  const nuevo: FotoItem = {
    id: data[0].id,
    titulo: data[0].titulo,
    categoria: data[0].categoria,
    imagen_url: data[0].imagen_url,
    descripcion: data[0].descripcion || "",
    es_destacado: Boolean(data[0].es_destacado),
    activo: Boolean(data[0].activo),
    orden: data[0].orden ?? 0,
  }
  const items = getFotos()
  const updated = [nuevo, ...items.filter(i => i.id !== nuevo.id)]
  saveFotos(updated)
  syncStoreToFiles("galeria", updated)
  return nuevo
}

export async function updateFoto(id: string, updates: Partial<FotoItem>): Promise<void> {
  if (!supabase) throw new Error("No hay conexión con la base de datos (Supabase no configurado).")
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  let query = supabase.from("galeria").update(updates)
  if (isUuid) {
    query = query.eq("id", id)
  } else {
    const item = getFotos().find(i => i.id === id)
    if (item?.titulo) {
      query = query.eq("titulo", item.titulo)
    } else {
      query = query.eq("id", id)
    }
  }
  const { error } = await query
  if (error) {
    console.error("[DB] Error al actualizar foto en Supabase:", error)
    throw new Error(error.message)
  }
  const items = getFotos()
  const updated = items.map(i => (i.id === id ? { ...i, ...updates } : i))
  saveFotos(updated)
  syncStoreToFiles("galeria", updated)
}

export async function deleteFoto(id: string): Promise<void> {
  if (!supabase) throw new Error("No hay conexión con la base de datos (Supabase no configurado).")
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  let query = supabase.from("galeria").delete()
  if (isUuid) {
    query = query.eq("id", id)
  } else {
    const item = getFotos().find(i => i.id === id)
    if (item?.titulo) {
      query = query.eq("titulo", item.titulo)
    } else {
      query = query.eq("id", id)
    }
  }
  const { error } = await query
  if (error) {
    console.error("[DB] Error al eliminar foto en Supabase:", error)
    throw new Error(error.message)
  }
  const updated = getFotos().filter(i => i.id !== id)
  saveFotos(updated)
  syncStoreToFiles("galeria", updated)
}

// ──────────────────────────────────────────────
// SACRAMENTOS
// ──────────────────────────────────────────────
export const getSacramentos = (): SacramentoItem[] => getStore<SacramentoItem>("sacramentos", seedSacramentos as SacramentoItem[])
export const saveSacramentos = (items: SacramentoItem[]) => setStore("sacramentos", items)

export async function fetchSacramentosFromDb(): Promise<SacramentoItem[]> {
  const local = getSacramentos()
  if (!supabase) return local
  try {
    const { data, error } = await supabase.from("sacramentos").select("*").order("orden", { ascending: true })
    if (error || !data) return local
    saveSacramentos(data as SacramentoItem[])
    return data as SacramentoItem[]
  } catch {
    return local
  }
}

export async function addSacramento(item: Omit<SacramentoItem, "id">): Promise<SacramentoItem> {
  if (!supabase) throw new Error("No hay conexión con la base de datos (Supabase no configurado).")
  const { data, error } = await supabase.from("sacramentos").insert([item]).select()
  if (error || !data?.[0]) {
    console.error("[DB] Error al insertar sacramento en Supabase:", error)
    throw new Error(error?.message || "Error al insertar sacramento en la base de datos")
  }
  const nuevo = data[0] as SacramentoItem
  const items = getSacramentos()
  const updated = [nuevo, ...items.filter(i => i.id !== nuevo.id)]
  saveSacramentos(updated)
  syncStoreToFiles("sacramentos", updated)
  return nuevo
}

export async function updateSacramento(id: string, updates: Partial<SacramentoItem>): Promise<void> {
  if (!supabase) throw new Error("No hay conexión con la base de datos (Supabase no configurado).")
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  let query = supabase.from("sacramentos").update(updates)
  if (isUuid) {
    query = query.eq("id", id)
  } else {
    const item = getSacramentos().find(i => i.id === id)
    if (item?.slug) {
      query = query.eq("slug", item.slug)
    } else {
      query = query.eq("id", id)
    }
  }
  const { error } = await query
  if (error) {
    console.error("[DB] Error al actualizar sacramento en Supabase:", error)
    throw new Error(error.message)
  }
  const items = getSacramentos()
  const updated = items.map(i => (i.id === id ? { ...i, ...updates } : i))
  saveSacramentos(updated)
  syncStoreToFiles("sacramentos", updated)
}

export async function deleteSacramento(id: string): Promise<void> {
  if (!supabase) throw new Error("No hay conexión con la base de datos (Supabase no configurado).")
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  let query = supabase.from("sacramentos").delete()
  if (isUuid) {
    query = query.eq("id", id)
  } else {
    const item = getSacramentos().find(i => i.id === id)
    if (item?.slug) {
      query = query.eq("slug", item.slug)
    } else {
      query = query.eq("id", id)
    }
  }
  const { error } = await query
  if (error) {
    console.error("[DB] Error al eliminar sacramento en Supabase:", error)
    throw new Error(error.message)
  }
  const updated = getSacramentos().filter(i => i.id !== id)
  saveSacramentos(updated)
  syncStoreToFiles("sacramentos", updated)
}

// ──────────────────────────────────────────────
// GRUPOS / COMUNIDAD
// ──────────────────────────────────────────────
export const getGrupos = (): GrupoItem[] => getStore<GrupoItem>("grupos", seedGrupos as GrupoItem[])
export const saveGrupos = (items: GrupoItem[]) => setStore("grupos", items)

export async function fetchGruposFromDb(): Promise<GrupoItem[]> {
  const local = getGrupos()
  if (!supabase) return local
  try {
    const { data, error } = await supabase.from("grupos").select("*").order("orden", { ascending: true })
    if (error || !data) return local
    saveGrupos(data as GrupoItem[])
    return data as GrupoItem[]
  } catch {
    return local
  }
}

export async function addGrupo(item: Omit<GrupoItem, "id">): Promise<GrupoItem> {
  if (!supabase) throw new Error("No hay conexión con la base de datos (Supabase no configurado).")
  const { data, error } = await supabase.from("grupos").insert([item]).select()
  if (error || !data?.[0]) {
    console.error("[DB] Error al insertar grupo en Supabase:", error)
    throw new Error(error?.message || "Error al insertar grupo en la base de datos")
  }
  const nuevo = data[0] as GrupoItem
  const items = getGrupos()
  const updated = [nuevo, ...items.filter(i => i.id !== nuevo.id)]
  saveGrupos(updated)
  syncStoreToFiles("grupos", updated)
  return nuevo
}

export async function updateGrupo(id: string, updates: Partial<GrupoItem>): Promise<void> {
  if (!supabase) throw new Error("No hay conexión con la base de datos (Supabase no configurado).")
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  let query = supabase.from("grupos").update(updates)
  if (isUuid) {
    query = query.eq("id", id)
  } else {
    const item = getGrupos().find(i => i.id === id)
    if (item?.nombre) {
      query = query.eq("nombre", item.nombre)
    } else {
      query = query.eq("id", id)
    }
  }
  const { error } = await query
  if (error) {
    console.error("[DB] Error al actualizar grupo en Supabase:", error)
    throw new Error(error.message)
  }
  const items = getGrupos()
  const updated = items.map(i => (i.id === id ? { ...i, ...updates } : i))
  saveGrupos(updated)
  syncStoreToFiles("grupos", updated)
}

export async function deleteGrupo(id: string): Promise<void> {
  if (!supabase) throw new Error("No hay conexión con la base de datos (Supabase no configurado).")
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  let query = supabase.from("grupos").delete()
  if (isUuid) {
    query = query.eq("id", id)
  } else {
    const item = getGrupos().find(i => i.id === id)
    if (item?.nombre) {
      query = query.eq("nombre", item.nombre)
    } else {
      query = query.eq("id", id)
    }
  }
  const { error } = await query
  if (error) {
    console.error("[DB] Error al eliminar grupo en Supabase:", error)
    throw new Error(error.message)
  }
  const updated = getGrupos().filter(i => i.id !== id)
  saveGrupos(updated)
  syncStoreToFiles("grupos", updated)
}
// ──────────────────────────────────────────────
// MENSAJES
// ──────────────────────────────────────────────
export const getMensajes = (): MensajeItem[] => getStore<MensajeItem>("mensajes", seedMensajes as MensajeItem[])
export const saveMensajes = (items: MensajeItem[]) => setStore("mensajes", items)

export async function fetchMensajesFromDb(): Promise<MensajeItem[]> {
  const local = getMensajes()
  if (!supabase) return local
  try {
    const { data, error } = await supabase
      .from("mensajes_contacto")
      .select("*")
      .order("created_at", { ascending: false })

    if (error || !data) return local
    const mapped: MensajeItem[] = data.map((d: any) => ({
      id: d.id,
      nombre: d.nombre || "Sin nombre",
      correo: d.correo || "",
      telefono: d.telefono || "",
      motivo: d.motivo || "Consulta General",
      mensaje: d.mensaje || "",
      canal_preferido: d.canal_preferido || "correo",
      leido: Boolean(d.leido),
      respondido: Boolean(d.respondido),
      created_at: d.created_at || new Date().toISOString(),
    }))
    saveMensajes(mapped)
    return mapped
  } catch (e) {
    console.warn("[DB] Error fetching mensajes:", e)
    return local
  }
}

export async function updateMensaje(id: string, updates: Partial<MensajeItem>): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("mensajes_contacto").update(updates).eq("id", id)
    if (error) {
      console.error("[DB] Error al actualizar mensaje en Supabase:", error)
      throw new Error(error.message)
    }
  }
  const items = getMensajes()
  const updated = items.map(i => (i.id === id ? { ...i, ...updates } : i))
  saveMensajes(updated)
  syncStoreToFiles("mensajes", updated)
}

export async function deleteMensaje(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("mensajes_contacto").delete().eq("id", id)
    if (error) {
      console.error("[DB] Error al eliminar mensaje en Supabase:", error)
      throw new Error(error.message)
    }
  }
  const updated = getMensajes().filter(i => i.id !== id)
  saveMensajes(updated)
  syncStoreToFiles("mensajes", updated)
}

// ──────────────────────────────────────────────
// DONACIONES Y SOSTENIMIENTO (HISTORIAL Y SEGUIMIENTO)
// ──────────────────────────────────────────────
export interface DonacionItem {
  id: string
  created_at: string
  monto: number
  moneda: string
  tipo: "unica_vez" | "mensual" | string
  estado: "approved" | "pending" | "rejected" | "in_process" | "authorized" | string
  mp_payment_id?: string
  mp_status_detail?: string
  nombre_donante?: string
  email_donante?: string
  metodo_pago?: string
  archivada?: boolean
  datos_adicionales?: Record<string, any>
}

export const getDonaciones = (): DonacionItem[] =>
  getStore<DonacionItem>("donaciones", seedDonaciones as DonacionItem[])

export const saveDonaciones = (items: DonacionItem[]) =>
  setStore("donaciones", items)

export async function fetchDonacionesFromDb(): Promise<DonacionItem[]> {
  const local = getDonaciones()

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("donaciones")
        .select("*")
        .order("created_at", { ascending: false })

      if (!error && data && data.length > 0) {
        const mapped: DonacionItem[] = data.map((d: any) => ({
          id: d.id,
          created_at: d.created_at || new Date().toISOString(),
          monto: Number(d.monto) || 0,
          moneda: d.moneda || "UYU",
          tipo: d.tipo || "unica_vez",
          estado: d.estado || "pending",
          mp_payment_id: d.mp_payment_id || undefined,
          mp_status_detail: d.mp_status_detail || undefined,
          nombre_donante: d.nombre_donante || "Anónimo",
          email_donante: d.email_donante || "",
          metodo_pago: d.metodo_pago || "Mercado Pago",
          archivada: Boolean(d.archivada),
          datos_adicionales: d.datos_adicionales || {},
        }))
        const deduped = deduplicateItems("donaciones", mapped)
        saveDonaciones(deduped)
        return deduped
      }
    } catch (e) {
      console.warn("[DB] Error fetching donaciones from Supabase:", e)
    }
  }

  return local
}

export async function toggleArchivarDonacion(id: string, archivada: boolean): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("donaciones").update({ archivada }).eq("id", id)
    if (error) {
      console.error("[DB] Error al archivar/desarchivar donacion en Supabase:", error)
      throw new Error(error.message)
    }
  }
  const updated = getDonaciones().map((i) =>
    i.id === id ? { ...i, archivada } : i
  )
  saveDonaciones(updated)
  syncStoreToFiles("donaciones", updated)
}

export async function deleteDonacion(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("donaciones").delete().eq("id", id)
    if (error) {
      console.error("[DB] Error al eliminar donacion en Supabase:", error)
      throw new Error(error.message)
    }
  }
  const updated = getDonaciones().filter(i => i.id !== id)
  saveDonaciones(updated)
  syncStoreToFiles("donaciones", updated)
}
