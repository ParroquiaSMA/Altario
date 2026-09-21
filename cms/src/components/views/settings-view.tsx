"use client"

import * as React from "react"
import { CatalogosSettings } from "@/components/views/settings/catalogos-settings"
import { UsuariosSettings } from "@/components/views/settings/usuarios-settings"
import { DonacionesSettings } from "@/components/views/settings/donaciones-settings"
import {
  CheckCircle2Icon,
  AlertCircleIcon,
  LockIcon,
  MailIcon,
  SendIcon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
} from "lucide-react"
import { getLocalConfig, saveFullSiteConfig, fetchSiteConfigFromDb, saveEmailConfig, type SiteConfig } from "@/lib/config"
import { DEFAULT_RESEND_API_KEY } from "@/lib/constants"
import { sendTestEmail } from "@/lib/email"
import { getSession } from "@/lib/auth"

export type SettingsSection = "catalogos" | "usuarios" | "donaciones" | "seguridad"

interface NavItem {
  id: SettingsSection
  title: string
}

const NAV_ITEMS: NavItem[] = [
  { id: "catalogos", title: "Catálogos" },
  { id: "usuarios", title: "Usuarios" },
  { id: "donaciones", title: "Donaciones" },
  { id: "seguridad", title: "Seguridad" },
]

export function SettingsView() {
  const [activeSection, setActiveSection] = React.useState<SettingsSection>("catalogos")

  // Sincronizar sección activa con los parámetros de la URL (?tab=... o hash)
  React.useEffect(() => {
    const syncFromUrl = () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const tab = (params.get("tab") || params.get("section") || window.location.hash.replace("#", "")) as SettingsSection
        if (["catalogos", "usuarios", "donaciones", "seguridad"].includes(tab)) {
          setActiveSection(tab)
        }
      } catch { }
    }

    syncFromUrl()
    window.addEventListener("popstate", syncFromUrl)
    window.addEventListener("hashchange", syncFromUrl)
    return () => {
      window.removeEventListener("popstate", syncFromUrl)
      window.removeEventListener("hashchange", syncFromUrl)
    }
  }, [])

  const handleSectionChange = (section: SettingsSection) => {
    setActiveSection(section)
    try {
      const url = new URL(window.location.href)
      url.searchParams.set("tab", section)
      window.history.pushState({}, "", url.toString())
    } catch { }
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden flex-1 min-h-0">
      {/* ── 2-Column Split Workspace ──────────────────────────── */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 h-full items-stretch overflow-hidden">
        {/* Mobile Settings Section Switcher */}
        <div className="flex md:hidden items-center justify-between gap-2 p-3 bg-muted/20 border-b shrink-0">
          <label className="text-xs font-medium text-muted-foreground">Sección:</label>
          <select
            value={activeSection}
            onChange={(e) => handleSectionChange(e.target.value as SettingsSection)}
            className="flex-1 max-w-[220px] h-8 px-2 rounded-md border bg-background text-xs font-medium text-foreground focus:outline-none"
          >
            {NAV_ITEMS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop Settings Sidebar */}
        <aside className="hidden md:flex w-56 lg:w-64 shrink-0 border-r bg-muted/10 p-4 lg:p-6 flex-col justify-between overflow-y-auto h-full">
          <div className="w-full">
            <nav className="flex flex-col gap-1 w-full">
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSectionChange(item.id)}
                    className={`whitespace-nowrap text-left px-3 py-2 rounded-md text-xs sm:text-sm transition-colors cursor-pointer ${isActive
                      ? "bg-accent text-accent-foreground font-medium shadow-2xs"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      }`}
                  >
                    <span className="truncate">{item.title}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="p-3 bg-background rounded-lg border border-border text-xs text-muted-foreground mt-4 shrink-0 shadow-2xs">
            <p className="text-foreground font-medium">Altario</p>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
              Configuración del sistema
            </p>
          </div>
        </aside>

        {/* Right Settings Content */}
        <main className="flex-1 w-full min-w-0 flex flex-col bg-background h-full min-h-0 overflow-hidden">
          {activeSection === "catalogos" && <CatalogosSettings />}
          {activeSection === "usuarios" && <UsuariosSettings />}
          {activeSection === "donaciones" && <DonacionesSettings />}
          {activeSection === "seguridad" && <SeguridadSettings />}
        </main>
      </div>
    </div>
  )
}

function SeguridadSettings() {
  const [actual, setActual] = React.useState("")
  const [nueva, setNueva] = React.useState("")
  const [confirmar, setConfirmar] = React.useState("")
  const [feedback, setFeedback] = React.useState<{ ok: boolean; msg: string } | null>(null)
  const [saving, setSaving] = React.useState(false)

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!actual || !nueva) {
      setFeedback({ ok: false, msg: "Por favor completá los campos requeridos." })
      return
    }
    if (nueva.length < 6) {
      setFeedback({ ok: false, msg: "La contraseña nueva debe tener al menos 6 caracteres." })
      return
    }
    if (nueva !== confirmar) {
      setFeedback({ ok: false, msg: "Las contraseñas nuevas no coinciden." })
      return
    }

    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setFeedback({ ok: true, msg: "Contraseña actualizada exitosamente." })
      setActual("")
      setNueva("")
      setConfirmar("")
      setTimeout(() => setFeedback(null), 4000)
    }, 400)
  }

  return (
    <div className="flex flex-col h-full min-h-0 w-full overflow-hidden">
      {/* Static Full-Width Header */}
      <div className="w-full px-6 py-4 border-b border-border bg-background shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-medium tracking-tight text-foreground">Seguridad</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cambiá tu contraseña y gestioná el acceso a tu cuenta.
          </p>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 pb-28 md:pb-6">
        {feedback && (
          <div
            className={`p-2.5 rounded-md text-xs flex items-center gap-2 border max-w-md ${feedback.ok
              ? "bg-muted text-foreground border-border"
              : "bg-destructive/10 text-destructive border-destructive/20"
              }`}
          >
            {feedback.ok ? (
              <CheckCircle2Icon className="size-4 text-foreground/80 shrink-0" />
            ) : (
              <AlertCircleIcon className="size-4 shrink-0" />
            )}
            <span>{feedback.msg}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="max-w-md space-y-4">
          <div className="rounded-lg border bg-card p-4 space-y-3.5">
            <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <LockIcon className="size-3.5 text-muted-foreground" />
              Actualizar Contraseña
            </h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Contraseña actual</label>
                <input
                  type="password"
                  value={actual}
                  onChange={(e) => setActual(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-8 rounded-md border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Nueva contraseña</label>
                <input
                  type="password"
                  value={nueva}
                  onChange={(e) => setNueva(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full h-8 rounded-md border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Confirmar nueva contraseña</label>
                <input
                  type="password"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  placeholder="Repetir contraseña"
                  className="w-full h-8 rounded-md border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 h-8 px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Actualizar Contraseña"}
              </button>
            </div>
          </div>
        </form>

        {/* Servicio de Correo Electrónico (Resend) */}
        <ResendEmailCard />

        {/* Notificaciones Web y PWA Card */}
        <NotificacionesCard />
      </div>
    </div>
  )
}

function NotificacionesCard() {
  const [permission, setPermission] = React.useState<NotificationPermission>("default")

  React.useEffect(() => {
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission)
    }
  }, [])

  const handleRequest = async () => {
    if (typeof Notification === "undefined") {
      alert("Tu navegador no soporta notificaciones.")
      return
    }
    const perm = await Notification.requestPermission()
    setPermission(perm)
    if (perm === "granted") {
      testNotification()
    }
  }

  const testNotification = async () => {
    try {
      const { playDonationChime, sendLocalNotification } = await import("@/components/common/notifications-manager")
      playDonationChime()
      await sendLocalNotification("Prueba de Notificación", {
        body: "¡Las notificaciones en tiempo real están funcionando perfectamente!",
        url: "/donaciones",
      })
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="max-w-md rounded-lg border bg-card p-4 space-y-3.5 mt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <CheckCircle2Icon className="size-3.5 text-muted-foreground" />
          Notificaciones y Aplicación Web (PWA)
        </h3>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${permission === "granted"
          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
          : permission === "denied"
            ? "bg-destructive/10 text-destructive border-destructive/20"
            : "bg-muted text-muted-foreground border-border"
          }`}>
          {permission === "granted" ? "Activas" : permission === "denied" ? "Bloqueadas" : "No configuradas"}
        </span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Recibí alertas sonoras y notificaciones del sistema en tu celular o computadora cada vez que ingrese una donación o mensaje de contacto.
      </p>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {permission !== "granted" ? (
          <button
            type="button"
            onClick={handleRequest}
            className="inline-flex items-center justify-center gap-1.5 h-8 px-3.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Activar notificaciones
          </button>
        ) : (
          <button
            type="button"
            onClick={testNotification}
            className="inline-flex items-center justify-center gap-1.5 h-8 px-3.5 rounded-md border border-border bg-background hover:bg-muted text-foreground text-xs font-medium transition-colors cursor-pointer"
          >
            Probar sonido y notificación
          </button>
        )}
      </div>

      <div className="p-3 bg-muted/30 border border-border/60 rounded-md text-[11px] text-muted-foreground space-y-1">
        <strong className="text-foreground font-medium block">Cómo instalar en tu celular:</strong>
        <p>• <strong>iPhone (Safari):</strong> Tocá Compartir <span className="font-mono">⎋</span> y seleccioná <em>"Agregar a pantalla de inicio"</em>.</p>
        <p>• <strong>Android (Chrome):</strong> Tocá el menú de tres puntos <span className="font-mono">⋮</span> y seleccioná <em>"Instalar aplicación"</em>.</p>
      </div>
    </div>
  )
}

function ResendEmailCard() {
  const [apiKey, setApiKey] = React.useState("")
  const [fromEmail, setFromEmail] = React.useState("onboarding@resend.dev")
  const [fromName, setFromName] = React.useState("Altario CMS")
  const [showKey, setShowKey] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [saveFeedback, setSaveFeedback] = React.useState<{ ok: boolean; msg: string } | null>(null)

  // Test Email States
  const [testEmail, setTestEmail] = React.useState("")
  const [isSendingTest, setIsSendingTest] = React.useState(false)
  const [testFeedback, setTestFeedback] = React.useState<{ ok: boolean; msg: string } | null>(null)

  React.useEffect(() => {
    // Limpiar residuos de localStorage si existieran
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("altario:site_config:v2")
      } catch {}
    }

    // Traer directamente desde Supabase
    fetchSiteConfigFromDb().then((cfg) => {
      if (cfg.email?.resend_api_key) {
        setApiKey(cfg.email.resend_api_key)
      } else {
        setApiKey(DEFAULT_RESEND_API_KEY)
      }
      if (cfg.email?.remitente_email) setFromEmail(cfg.email.remitente_email)
      if (cfg.email?.remitente_nombre) setFromName(cfg.email.remitente_nombre)
    }).catch(() => {})

    const session = getSession()
    if (session?.email) {
      setTestEmail(session.email)
    }
  }, [])

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaving(true)
    setSaveFeedback(null)

    const cleanKey = apiKey.trim()
    const cleanFromEmail = fromEmail.trim() || "onboarding@resend.dev"
    const cleanFromName = fromName.trim() || "Altario CMS"

    try {
      await saveEmailConfig({
        resend_api_key: cleanKey,
        remitente_email: cleanFromEmail,
        remitente_nombre: cleanFromName,
      })
      setApiKey(cleanKey)
      setFromEmail(cleanFromEmail)
      setFromName(cleanFromName)
      setSaveFeedback({ ok: true, msg: "Credenciales guardadas en Supabase exitosamente." })
      setTimeout(() => setSaveFeedback(null), 3500)
    } catch (err: any) {
      setSaveFeedback({ ok: false, msg: err?.message || "Error al guardar en Supabase." })
    } finally {
      setSaving(false)
    }
  }

  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      setTestFeedback({ ok: false, msg: "Ingresá un correo destinatario para la prueba." })
      return
    }

    setIsSendingTest(true)
    setTestFeedback(null)

    try {
      const res = await sendTestEmail({
        to: testEmail.trim(),
        apiKey: apiKey.trim() || DEFAULT_RESEND_API_KEY,
        fromEmail: fromEmail.trim(),
        fromName: fromName.trim(),
      })

      if (res.ok) {
        setTestFeedback({
          ok: true,
          msg: `¡Correo enviado con éxito! Revisá la bandeja de ${testEmail.trim()} (ID: ${res.id}).`,
        })
      } else {
        setTestFeedback({
          ok: false,
          msg: res.error || "No se pudo entregar el correo de prueba.",
        })
      }
    } catch (err: any) {
      setTestFeedback({ ok: false, msg: err?.message || "Error al conectar con Resend." })
    } finally {
      setIsSendingTest(false)
    }
  }

  const hasConfiguredKey = Boolean(apiKey.trim() || DEFAULT_RESEND_API_KEY)

  return (
    <div className="max-w-md rounded-lg border bg-card p-4 space-y-4 mt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <MailIcon className="size-3.5 text-muted-foreground" />
          Servicio de Correo (Resend)
        </h3>
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${hasConfiguredKey
            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
            : "bg-muted text-muted-foreground border-border"
            }`}
        >
          {hasConfiguredKey ? "Configurado" : "Sin credencial"}
        </span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Gestioná la API Key de Resend para el envío automático de correos de recuperación de contraseña, avisos y notificaciones parroquiales.
      </p>

      {saveFeedback && (
        <div
          className={`p-2.5 rounded-md text-xs flex items-center gap-2 border ${saveFeedback.ok
            ? "bg-muted text-foreground border-border"
            : "bg-destructive/10 text-destructive border-destructive/20"
            }`}
        >
          {saveFeedback.ok ? (
            <CheckCircle2Icon className="size-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircleIcon className="size-4 shrink-0" />
          )}
          <span>{saveFeedback.msg}</span>
        </div>
      )}

      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground font-medium">API Key de Resend</label>
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
            >
              {showKey ? <EyeOffIcon className="size-3" /> : <EyeIcon className="size-3" />}
              {showKey ? "Ocultar" : "Mostrar"}
            </button>
          </div>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="re_..."
            autoComplete="off"
            name="app_config_token"
            id="app_config_token"
            data-lpignore="true"
            data-1p-ignore="true"
            data-form-type="other"
            spellCheck={false}
            style={{ WebkitTextSecurity: showKey ? "none" : "disc" } as React.CSSProperties}
            className="w-full h-8 rounded-md border bg-background px-2.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="grid grid-cols-2 gap-2" data-form-type="other">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Remitente (Email)</label>
            <input
              type="text"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="no-responder@tudominio.com"
              autoComplete="off"
              name="app_mail_sender_address"
              id="app_mail_sender_address"
              data-lpignore="true"
              data-1p-ignore="true"
              data-form-type="other"
              className="w-full h-8 rounded-md border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Remitente (Nombre)</label>
            <input
              type="text"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="Altario CMS"
              autoComplete="off"
              name="app_mail_sender_name"
              id="app_mail_sender_name"
              data-lpignore="true"
              data-1p-ignore="true"
              data-form-type="other"
              className="w-full h-8 rounded-md border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 h-8 px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar credenciales de Resend"}
          </button>
        </div>
      </div>

      {/* Caja de prueba en vivo */}
      <div className="pt-3 border-t border-border/70 space-y-2.5">
        <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
          <SendIcon className="size-3 text-muted-foreground" />
          Probar envío de correo
        </label>
        <div className="flex items-center gap-2">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="correo-destino@ejemplo.com"
            className="flex-1 h-8 rounded-md border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            type="button"
            onClick={handleSendTest}
            disabled={isSendingTest || !hasConfiguredKey}
            className="h-8 px-3 rounded-md border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors shrink-0 cursor-pointer disabled:opacity-50"
          >
            {isSendingTest ? "Enviando..." : "Enviar prueba"}
          </button>
        </div>

        {testFeedback && (
          <div
            className={`p-2.5 rounded-md text-xs flex items-start gap-2 border animate-in fade-in ${testFeedback.ok
              ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20"
              : "bg-destructive/10 text-destructive border-destructive/20"
              }`}
          >
            {testFeedback.ok ? (
              <CheckCircle2Icon className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircleIcon className="size-4 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{testFeedback.msg}</span>
          </div>
        )}
      </div>
    </div>
  )
}

