import { supabase } from "@/lib/supabase"
import seedHorarios from "@/data/seeds/horarios.json"
import seedAvisos from "@/data/seeds/avisos.json"
import seedFotos from "@/data/seeds/galeria.json"
import seedMensajes from "@/data/seeds/mensajes.json"
import seedSacramentos from "@/data/seeds/sacramentos.json"
import seedGrupos from "@/data/seeds/grupos.json"

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

function syncStoreToFiles(store: string, data: any): void {
  if (typeof window === "undefined") return
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
  let nuevoId = `h-${Date.now()}`
  if (supabase) {
    try {
      const { data, error } = await supabase.from("horarios").insert([item]).select()
      if (!error && data?.[0]) nuevoId = data[0].id
    } catch (e) {
      console.warn("[DB] Error al insertar horario en Supabase:", e)
    }
  }
  const nuevo = { ...item, id: nuevoId }
  const items = getHorarios()
  const updated = [nuevo, ...items.filter(i => i.id !== nuevoId)]
  saveHorarios(updated)
  syncStoreToFiles("horarios", updated)
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
  const updated = items.map(i => (i.id === id ? { ...i, ...updates } : i))
  saveHorarios(updated)
  syncStoreToFiles("horarios", updated)
}

export async function deleteHorario(id: string): Promise<void> {
  if (supabase) {
    try {
      await supabase.from("horarios").delete().eq("id", id)
    } catch (e) {
      console.warn("[DB] Error al eliminar horario en Supabase:", e)
    }
  }
  const updated = getHorarios().filter(i => i.id !== id)
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
  let nuevoId = `a-${Date.now()}`
  if (supabase) {
    try {
      const { data, error } = await supabase.from("avisos").insert([item]).select()
      if (!error && data?.[0]) nuevoId = data[0].id
    } catch (e) {
      console.warn("[DB] Error al insertar aviso en Supabase:", e)
    }
  }
  const nuevo = { ...item, id: nuevoId }
  const items = getAvisos()
  const updated = [nuevo, ...items.filter(i => i.id !== nuevoId)]
  saveAvisos(updated)
  syncStoreToFiles("avisos", updated)
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
  const updated = items.map(i => (i.id === id ? { ...i, ...updates } : i))
  saveAvisos(updated)
  syncStoreToFiles("avisos", updated)
}

export async function deleteAviso(id: string): Promise<void> {
  if (supabase) {
    try {
      await supabase.from("avisos").delete().eq("id", id)
    } catch (e) {
      console.warn("[DB] Error al eliminar aviso en Supabase:", e)
    }
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
  let nuevoId = `f-${Date.now()}`
  if (supabase) {
    try {
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

      if (error) {
        console.error("[DB] Error al insertar foto en Supabase:", error)
      } else if (data?.[0]) {
        nuevoId = data[0].id
      }
    } catch (e) {
      console.warn("[DB] Error al insertar foto en Supabase:", e)
    }
  }

  const nuevo: FotoItem = { ...item, id: nuevoId }
  const items = getFotos()
  const updated = [nuevo, ...items.filter(i => i.id !== nuevoId)]
  saveFotos(updated)
  syncStoreToFiles("galeria", updated)
  return nuevo
}

export async function updateFoto(id: string, updates: Partial<FotoItem>): Promise<void> {
  if (supabase) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      if (isUuid) {
        await supabase.from("galeria").update(updates).eq("id", id)
      }
    } catch (e) {
      console.warn("[DB] Error al actualizar foto en Supabase:", e)
    }
  }
  const items = getFotos()
  const updated = items.map(i => (i.id === id ? { ...i, ...updates } : i))
  saveFotos(updated)
  syncStoreToFiles("galeria", updated)
}

export async function deleteFoto(id: string): Promise<void> {
  if (supabase) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      if (isUuid) {
        await supabase.from("galeria").delete().eq("id", id)
      } else {
        const item = getFotos().find(i => i.id === id)
        if (item?.titulo) {
          await supabase.from("galeria").delete().eq("titulo", item.titulo)
        }
      }
    } catch (e) {
      console.warn("[DB] Error al eliminar foto en Supabase:", e)
    }
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
  let nuevoId = `s-${Date.now()}`
  if (supabase) {
    try {
      const { data, error } = await supabase.from("sacramentos").insert([item]).select()
      if (!error && data?.[0]) nuevoId = data[0].id
    } catch (e) {
      console.warn("[DB] Error al insertar sacramento en Supabase:", e)
    }
  }
  const nuevo = { ...item, id: nuevoId }
  const items = getSacramentos()
  const updated = [nuevo, ...items.filter(i => i.id !== nuevoId)]
  saveSacramentos(updated)
  syncStoreToFiles("sacramentos", updated)
  return nuevo
}

export async function updateSacramento(id: string, updates: Partial<SacramentoItem>): Promise<void> {
  if (supabase) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      if (isUuid) {
        await supabase.from("sacramentos").update(updates).eq("id", id)
      } else {
        const item = getSacramentos().find(i => i.id === id)
        if (item?.slug) {
          await supabase.from("sacramentos").update(updates).eq("slug", item.slug)
        }
      }
    } catch (e) {
      console.warn("[DB] Error al actualizar sacramento en Supabase:", e)
    }
  }
  const items = getSacramentos()
  const updated = items.map(i => (i.id === id ? { ...i, ...updates } : i))
  saveSacramentos(updated)
  syncStoreToFiles("sacramentos", updated)
}

export async function deleteSacramento(id: string): Promise<void> {
  if (supabase) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      if (isUuid) {
        await supabase.from("sacramentos").delete().eq("id", id)
      } else {
        const item = getSacramentos().find(i => i.id === id)
        if (item?.slug) {
          await supabase.from("sacramentos").delete().eq("slug", item.slug)
        }
      }
    } catch (e) {
      console.warn("[DB] Error al eliminar sacramento en Supabase:", e)
    }
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
  let nuevoId = `g-${Date.now()}`
  if (supabase) {
    try {
      const { data, error } = await supabase.from("grupos").insert([item]).select()
      if (!error && data?.[0]) nuevoId = data[0].id
    } catch (e) {
      console.warn("[DB] Error al insertar grupo en Supabase:", e)
    }
  }
  const nuevo = { ...item, id: nuevoId }
  const items = getGrupos()
  const updated = [nuevo, ...items.filter(i => i.id !== nuevoId)]
  saveGrupos(updated)
  syncStoreToFiles("grupos", updated)
  return nuevo
}

export async function updateGrupo(id: string, updates: Partial<GrupoItem>): Promise<void> {
  if (supabase) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      if (isUuid) {
        await supabase.from("grupos").update(updates).eq("id", id)
      } else {
        const item = getGrupos().find(i => i.id === id)
        if (item?.nombre) {
          await supabase.from("grupos").update(updates).eq("nombre", item.nombre)
        }
      }
    } catch (e) {
      console.warn("[DB] Error al actualizar grupo en Supabase:", e)
    }
  }
  const items = getGrupos()
  const updated = items.map(i => (i.id === id ? { ...i, ...updates } : i))
  saveGrupos(updated)
  syncStoreToFiles("grupos", updated)
}

export async function deleteGrupo(id: string): Promise<void> {
  if (supabase) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      if (isUuid) {
        await supabase.from("grupos").delete().eq("id", id)
      } else {
        const item = getGrupos().find(i => i.id === id)
        if (item?.nombre) {
          await supabase.from("grupos").delete().eq("nombre", item.nombre)
        }
      }
    } catch (e) {
      console.warn("[DB] Error al eliminar grupo en Supabase:", e)
    }
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
    try {
      await supabase.from("mensajes_contacto").update(updates).eq("id", id)
    } catch (e) {
      console.warn("[DB] Error al actualizar mensaje en Supabase:", e)
    }
  }
  const items = getMensajes()
  const updated = items.map(i => (i.id === id ? { ...i, ...updates } : i))
  saveMensajes(updated)
  syncStoreToFiles("mensajes", updated)
}

export async function deleteMensaje(id: string): Promise<void> {
  if (supabase) {
    try {
      await supabase.from("mensajes_contacto").delete().eq("id", id)
    } catch (e) {
      console.warn("[DB] Error al eliminar mensaje en Supabase:", e)
    }
  }
  const updated = getMensajes().filter(i => i.id !== id)
  saveMensajes(updated)
  syncStoreToFiles("mensajes", updated)
}
