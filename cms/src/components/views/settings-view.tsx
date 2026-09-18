"use client"

import * as React from "react"
import { CatalogosSettings } from "@/components/views/settings/catalogos-settings"
import { UsuariosSettings } from "@/components/views/settings/usuarios-settings"
import { DonacionesSettings } from "@/components/views/settings/donaciones-settings"
import { CheckCircle2Icon, AlertCircleIcon, LockIcon } from "lucide-react"

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

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden flex-1 min-h-0">
      {/* ── 2-Column Split Workspace ──────────────────────────── */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 h-full items-stretch overflow-hidden">
        {/* Left Settings Submenu (Sizing identical to donaciones) */}
        <aside className="w-full md:w-56 lg:w-64 shrink-0 border-r bg-muted/10 p-4 lg:p-6 flex flex-col justify-between overflow-y-auto min-h-0 h-full">
          <div className="space-y-4">
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors cursor-pointer ${
                      isActive
                        ? "bg-accent text-accent-foreground font-medium"
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
        <main className="flex-1 w-full min-w-0 overflow-hidden flex flex-col bg-background h-full min-h-0">
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
      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
        {feedback && (
          <div
            className={`p-2.5 rounded-md text-xs flex items-center gap-2 border max-w-md ${
              feedback.ok
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
      </div>
    </div>
  )
}
