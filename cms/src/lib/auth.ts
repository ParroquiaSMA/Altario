import seedUsuarios from "@/data/seeds/usuarios.json"
import { supabase } from "@/lib/supabase"

export interface CMSUser {
  id: string
  nombre: string
  email: string
  rol: "admin" | "editor" | "viewer"
  status: "activo" | "inactivo"
  passwordHash: string
}

const USERS_STORAGE_KEY = "altario:cms:users:v2"
const SESSION_STORAGE_KEY = "altario:cms:session:v2"

export function hashPassword(password: string): string {
  let h = 0
  for (let i = 0; i < password.length; i++) {
    h = (Math.imul(31, h) + password.charCodeAt(i)) | 0
  }
  return `hash:${Math.abs(h).toString(36)}:${password.length}`
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

export function getUsers(): CMSUser[] {
  if (typeof window === "undefined") return seedUsuarios as CMSUser[]
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY)
    if (!stored) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(seedUsuarios))
      return seedUsuarios as CMSUser[]
    }
    return JSON.parse(stored) as CMSUser[]
  } catch {
    return seedUsuarios as CMSUser[]
  }
}

export function saveUsers(users: CMSUser[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
}

export function addUser(user: Omit<CMSUser, "id" | "passwordHash"> & { password: string }): CMSUser {
  const users = getUsers()
  const nuevo: CMSUser = {
    ...user,
    id: `user-${Date.now()}`,
    passwordHash: hashPassword(user.password),
  }
  if (supabase) {
    supabase.from("usuarios_cms").insert([{
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      status: user.status,
      password_hash: nuevo.passwordHash,
    }]).then(() => {})
  }
  saveUsers([nuevo, ...users])
  return nuevo
}

export function updateUser(id: string, updates: Partial<Omit<CMSUser, "id">>): void {
  const users = getUsers()
  if (supabase) {
    supabase.from("usuarios_cms").update(updates).eq("id", id).then(() => {})
  }
  saveUsers(users.map((u) => (u.id === id ? { ...u, ...updates } : u)))
}

export function deleteUser(id: string): void {
  const users = getUsers()
  if (supabase) {
    supabase.from("usuarios_cms").delete().eq("id", id).then(() => {})
  }
  saveUsers(users.filter((u) => u.id !== id))
}

export function changeUserPassword(id: string, newPassword: string): void {
  updateUser(id, { passwordHash: hashPassword(newPassword) })
}

export interface Session {
  userId: string
  email: string
  nombre: string
  rol: CMSUser["rol"]
  expiresAt: number
}

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000 // 8 hours

export function login(email: string, password: string): { ok: boolean; error?: string } {
  const users = getUsers()
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())

  if (!user) return { ok: false, error: "Correo no encontrado" }
  if (user.status === "inactivo") return { ok: false, error: "Usuario desactivado" }
  if (!verifyPassword(password, user.passwordHash)) return { ok: false, error: "Contraseña incorrecta" }

  const session: Session = {
    userId: user.id,
    email: user.email,
    nombre: user.nombre,
    rol: user.rol,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  }

  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  return { ok: true }
}

export function logout(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!stored) return null
    const session = JSON.parse(stored) as Session
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_STORAGE_KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  return getSession() !== null
}

export function requireAuth(): void {
  if (!isAuthenticated()) {
    window.location.replace("/login")
  }
}
