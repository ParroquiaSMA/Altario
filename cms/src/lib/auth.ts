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

let usersMemory: CMSUser[] = seedUsuarios as CMSUser[]

export function getUsers(): CMSUser[] {
  return usersMemory
}

export function saveUsers(users: CMSUser[]): void {
  usersMemory = users
}

/**
 * Carga los usuarios directamente desde la tabla `usuarios_cms` en Supabase
 */
export async function fetchUsersFromDb(): Promise<CMSUser[]> {
  if (!supabase) return usersMemory
  try {
    const { data, error } = await supabase
      .from("usuarios_cms")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data && data.length > 0) {
      const mapped: CMSUser[] = data.map((row: any) => ({
        id: row.id,
        nombre: row.nombre,
        email: row.email,
        rol: row.rol,
        status: row.status,
        passwordHash: row.password_hash || "",
      }))
      usersMemory = mapped
      return mapped
    }
  } catch (err) {
    console.warn("[Auth] Error al obtener usuarios de Supabase:", err)
  }
  return usersMemory
}

export async function addUserAsync(
  user: Omit<CMSUser, "id" | "passwordHash"> & { password?: string }
): Promise<CMSUser> {
  const initialPassword = user.password || `pwd_${Math.random().toString(36).slice(2)}_${Date.now()}`
  const passwordHash = hashPassword(initialPassword)
  let assignedId = `user-${Date.now()}`

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("usuarios_cms")
        .insert([{
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
          status: user.status,
          password_hash: passwordHash,
        }])
        .select()
        .single()

      if (!error && data?.id) {
        assignedId = data.id
      }
    } catch (err) {
      console.warn("[Auth] Excepción al insertar usuario en Supabase:", err)
    }
  }

  const nuevo: CMSUser = {
    ...user,
    id: assignedId,
    passwordHash,
  }

  const current = getUsers().filter((u) => u.email.toLowerCase() !== nuevo.email.toLowerCase())
  saveUsers([nuevo, ...current])
  return nuevo
}

export function addUser(user: Omit<CMSUser, "id" | "passwordHash"> & { password?: string }): CMSUser {
  const initialPassword = user.password || `pwd_${Math.random().toString(36).slice(2)}_${Date.now()}`
  const nuevo: CMSUser = {
    ...user,
    id: `user-${Date.now()}`,
    passwordHash: hashPassword(initialPassword),
  }
  if (supabase) {
    supabase
      .from("usuarios_cms")
      .insert([{
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        status: user.status,
        password_hash: nuevo.passwordHash,
      }])
      .then(() => {}, () => {})
  }
  const users = getUsers()
  saveUsers([nuevo, ...users])
  return nuevo
}

export function updateUser(id: string, updates: Partial<Omit<CMSUser, "id">>): void {
  const users = getUsers()
  if (supabase) {
    const dbUpdates: Record<string, any> = {}
    if (updates.nombre !== undefined) dbUpdates.nombre = updates.nombre
    if (updates.email !== undefined) dbUpdates.email = updates.email
    if (updates.rol !== undefined) dbUpdates.rol = updates.rol
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.passwordHash !== undefined) dbUpdates.password_hash = updates.passwordHash

    supabase.from("usuarios_cms").update(dbUpdates).eq("id", id).then(() => {}, () => {})
  }
  saveUsers(users.map((u) => (u.id === id ? { ...u, ...updates } : u)))
}

export function deleteUser(id: string): void {
  const users = getUsers()
  if (supabase) {
    supabase.from("usuarios_cms").delete().eq("id", id).then(() => {}, () => {})
  }
  saveUsers(users.filter((u) => u.id !== id))
}

export function changeUserPassword(id: string, newPassword: string): void {
  const passwordHash = hashPassword(newPassword)
  if (supabase) {
    supabase.from("usuarios_cms").update({ password_hash: passwordHash }).eq("id", id).then(() => {}, () => {})
  }
  const users = getUsers()
  saveUsers(users.map((u) => (u.id === id ? { ...u, passwordHash } : u)))
}

export interface Session {
  userId: string
  email: string
  nombre: string
  rol: CMSUser["rol"]
  expiresAt: number
}

const SESSION_DURATION_SESSION_MS = 8 * 60 * 60 * 1000 // 8 horas
const SESSION_DURATION_REMEMBER_MS = 30 * 24 * 60 * 60 * 1000 // 30 días

export function login(
  email: string,
  password: string,
  rememberMe = true
): { ok: boolean; error?: string } {
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
    expiresAt: Date.now() + (rememberMe ? SESSION_DURATION_REMEMBER_MS : SESSION_DURATION_SESSION_MS),
  }

  if (typeof window !== "undefined") {
    if (rememberMe) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
    } else {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
      localStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }

  return { ok: true }
}

export async function loginAsync(
  email: string,
  password: string,
  rememberMe = true
): Promise<{ ok: boolean; error?: string }> {
  const users = await fetchUsersFromDb()
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())

  if (!user) return { ok: false, error: "Correo no encontrado" }
  if (user.status === "inactivo") return { ok: false, error: "Usuario desactivado" }
  if (!verifyPassword(password, user.passwordHash)) return { ok: false, error: "Contraseña incorrecta" }

  const session: Session = {
    userId: user.id,
    email: user.email,
    nombre: user.nombre,
    rol: user.rol,
    expiresAt: Date.now() + (rememberMe ? SESSION_DURATION_REMEMBER_MS : SESSION_DURATION_SESSION_MS),
  }

  if (typeof window !== "undefined") {
    if (rememberMe) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
    } else {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
      localStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }

  return { ok: true }
}

export function logout(): void {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(SESSION_STORAGE_KEY)
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null
  try {
    const stored =
      localStorage.getItem(SESSION_STORAGE_KEY) ||
      sessionStorage.getItem(SESSION_STORAGE_KEY)

    if (!stored) return null
    const session = JSON.parse(stored) as Session
    if (Date.now() > session.expiresAt) {
      logout()
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

// ── Recuperación y Restablecimiento de Contraseñas (En Supabase, 0 localStorage) ──

export interface PasswordResetRecord {
  token: string
  email: string
  userId: string
  expiresAt: number
  used: boolean
  createdAt?: number
  usedAt?: number
  lastSentAt?: number
}

let resetTokensMemory: PasswordResetRecord[] = []
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000 // 30 minutos

export async function fetchResetTokensFromDb(): Promise<PasswordResetRecord[]> {
  if (!supabase) return resetTokensMemory
  try {
    const { data, error } = await supabase
      .from("configuracion")
      .select("valor")
      .eq("clave", "password_reset_tokens")
      .single()

    if (!error && Array.isArray(data?.valor)) {
      resetTokensMemory = data.valor
      return resetTokensMemory
    }
  } catch {}
  return resetTokensMemory
}

export async function saveResetTokensToDb(tokens: PasswordResetRecord[]): Promise<void> {
  resetTokensMemory = tokens
  if (!supabase) return
  try {
    await supabase.from("configuracion").upsert({
      clave: "password_reset_tokens",
      valor: tokens,
      updated_at: new Date().toISOString(),
    }, { onConflict: "clave" })
  } catch (err) {
    console.warn("[Auth] Error al guardar tokens en configuracion:", err)
  }
}

export function createInvitationToken(
  userId: string,
  email: string,
  appOrigin?: string
): { token: string; link: string } {
  const randomPart = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10)
  const token = `inv_${Date.now()}_${randomPart}`
  const now = Date.now()
  const expiresAt = now + 7 * 24 * 60 * 60 * 1000 // 7 días
  const cleanEmail = email.trim().toLowerCase()

  const record: PasswordResetRecord = {
    token,
    email: cleanEmail,
    userId,
    createdAt: now,
    expiresAt,
    used: false,
    lastSentAt: now,
  }

  // Guardar en memoria y sincronizar con Supabase
  const activeTokens = resetTokensMemory.filter((t) => t.expiresAt > Date.now() && !t.used)
  resetTokensMemory = [...activeTokens, record]

  if (supabase) {
    fetchResetTokensFromDb().then((dbTokens) => {
      const merged = [
        ...dbTokens.filter((t) => t.expiresAt > Date.now() && !t.used && t.token !== token),
        record,
      ]
      saveResetTokensToDb(merged)
    }).catch(() => {
      saveResetTokensToDb(resetTokensMemory)
    })
  }

  const origin =
    appOrigin ||
    (typeof window !== "undefined" ? window.location.origin : "https://app.santamariadelaayuda.org")
  const link = `${origin}/login?reset_token=${encodeURIComponent(token)}`

  return { token, link }
}

export async function createOrRenewInvitation(
  userId: string,
  email: string,
  appOrigin?: string
): Promise<{ token: string; link: string; record: PasswordResetRecord }> {
  const randomPart = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10)
  const token = `inv_${Date.now()}_${randomPart}`
  const now = Date.now()
  const expiresAt = now + 7 * 24 * 60 * 60 * 1000 // 7 días
  const cleanEmail = email.trim().toLowerCase()

  const record: PasswordResetRecord = {
    token,
    email: cleanEmail,
    userId,
    createdAt: now,
    expiresAt,
    used: false,
    lastSentAt: now,
  }

  const existingTokens = await fetchResetTokensFromDb()
  // Reemplazar invitaciones previas no usadas de este usuario
  const remaining = existingTokens.filter(
    (t) => !(t.userId === userId || t.email.toLowerCase() === cleanEmail) || t.used
  )
  const updated = [...remaining, record]
  await saveResetTokensToDb(updated)

  const origin =
    appOrigin ||
    (typeof window !== "undefined" ? window.location.origin : "https://app.santamariadelaayuda.org")
  const link = `${origin}/login?reset_token=${encodeURIComponent(token)}`

  return { token, link, record }
}

export interface UserInviteStatus {
  hasInvite: boolean
  isPending: boolean
  isExpired: boolean
  isUsed: boolean
  token?: string
  link?: string
  expiresAt?: number
  createdAt?: number
  usedAt?: number
  lastSentAt?: number
}

export function getUserInviteStatus(
  user: CMSUser,
  tokens: PasswordResetRecord[],
  appOrigin?: string
): UserInviteStatus {
  const origin =
    appOrigin ||
    (typeof window !== "undefined" ? window.location.origin : "https://app.santamariadelaayuda.org")

  const cleanEmail = user.email.toLowerCase()
  const userTokens = tokens
    .filter(
      (t) =>
        t.token.startsWith("inv_") &&
        (t.userId === user.id || t.email.toLowerCase() === cleanEmail)
    )
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

  const latest = userTokens[0]

  if (!latest) {
    return {
      hasInvite: false,
      isPending: false,
      isExpired: false,
      isUsed: false,
    }
  }

  const isUsed = Boolean(latest.used)
  const isExpired = !isUsed && Date.now() > latest.expiresAt
  const isPending = !isUsed && !isExpired
  const link = `${origin}/login?reset_token=${encodeURIComponent(latest.token)}`

  return {
    hasInvite: true,
    isPending,
    isExpired,
    isUsed,
    token: latest.token,
    link,
    expiresAt: latest.expiresAt,
    createdAt: latest.createdAt,
    usedAt: latest.usedAt,
    lastSentAt: latest.lastSentAt,
  }
}

export async function requestPasswordReset(
  email: string,
  appOrigin?: string
): Promise<{
  ok: boolean
  error?: string
  resetToken?: string
  resetLink?: string
  emailSent: boolean
}> {
  const cleanEmail = email.trim().toLowerCase()
  const users = await fetchUsersFromDb()
  const user = users.find((u) => u.email.toLowerCase() === cleanEmail)

  if (!user) {
    return { ok: false, error: "No existe ninguna cuenta registrada con ese correo.", emailSent: false }
  }

  if (user.status === "inactivo") {
    return { ok: false, error: "Esta cuenta se encuentra desactivada por el administrador.", emailSent: false }
  }

  const randomPart = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10)
  const token = `rst_${Date.now()}_${randomPart}`
  const expiresAt = Date.now() + RESET_TOKEN_TTL_MS

  const record: PasswordResetRecord = {
    token,
    email: user.email,
    userId: user.id,
    expiresAt,
    used: false,
  }

  const currentTokens = await fetchResetTokensFromDb()
  const activeTokens = currentTokens.filter((t) => t.expiresAt > Date.now() && !t.used)
  await saveResetTokensToDb([...activeTokens, record])

  const origin =
    appOrigin ||
    (typeof window !== "undefined" ? window.location.origin : "https://app.santamariadelaayuda.org")
  const resetLink = `${origin}/login?reset_token=${encodeURIComponent(token)}`

  let emailSent = false
  try {
    const { sendPasswordResetEmail } = await import("./email")
    const resendResult = await sendPasswordResetEmail({
      to: user.email,
      resetToken: token,
      userName: user.nombre,
      appOrigin: origin,
    })
    emailSent = resendResult.ok
    if (!resendResult.ok) {
      console.warn("[Auth] Resend notice:", resendResult.error)
    }
  } catch (mailErr) {
    console.warn("[Auth] No se pudo enviar el correo vía Resend:", mailErr)
  }

  return {
    ok: true,
    resetToken: token,
    resetLink,
    emailSent,
  }
}

export function verifyResetToken(token: string): {
  ok: boolean
  email?: string
  userId?: string
  error?: string
} {
  if (!token) return { ok: false, error: "Token no proporcionado" }

  const record = resetTokensMemory.find((t) => t.token === token)
  if (!record) {
    return { ok: false, error: "El enlace de recuperación es inválido o ya expiró." }
  }
  if (record.used) {
    return { ok: false, error: "Este enlace de recuperación ya fue utilizado." }
  }
  if (Date.now() > record.expiresAt) {
    return { ok: false, error: "El enlace de recuperación ha vencido." }
  }

  return { ok: true, email: record.email, userId: record.userId }
}

export async function verifyResetTokenAsync(token: string): Promise<{
  ok: boolean
  email?: string
  userId?: string
  error?: string
}> {
  if (!token) return { ok: false, error: "Token no proporcionado" }

  const tokens = await fetchResetTokensFromDb()
  const record = tokens.find((t) => t.token === token)

  if (!record) {
    return { ok: false, error: "El enlace de recuperación es inválido o ya expiró." }
  }
  if (record.used) {
    return { ok: false, error: "Este enlace de recuperación ya fue utilizado." }
  }
  if (Date.now() > record.expiresAt) {
    return { ok: false, error: "El enlace de recuperación ha vencido." }
  }

  return { ok: true, email: record.email, userId: record.userId }
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<{ ok: boolean; error?: string }> {
  const verification = await verifyResetTokenAsync(token)
  if (!verification.ok || !verification.userId) {
    return { ok: false, error: verification.error || "Token inválido" }
  }

  if (!newPassword || newPassword.length < 6) {
    return { ok: false, error: "La contraseña debe tener al menos 6 caracteres." }
  }

  // Actualizar contraseña del usuario en Supabase y memoria
  changeUserPassword(verification.userId, newPassword)

  // Marcar token como utilizado en Supabase
  const tokens = await fetchResetTokensFromDb()
  await saveResetTokensToDb(
    tokens.map((t) => (t.token === token ? { ...t, used: true } : t))
  )

  return { ok: true }
}
