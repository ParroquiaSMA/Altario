"use client"

import * as React from "react"
import { FullPageModal } from "@/components/ui/full-page-modal"
import { SitioSettings } from "@/components/views/settings/sitio-settings"
import { UsuariosSettings } from "@/components/views/settings/usuarios-settings"
import { CatalogosSettings } from "@/components/views/settings/catalogos-settings"
import { GeneralSettings } from "@/components/views/settings/general-settings"
import {
  GlobeIcon,
  LayersIcon,
  UsersIcon,
  SlidersIcon,
  BellIcon,
  ShieldCheckIcon,
} from "lucide-react"

type SettingsSection = "sitio" | "catalogos" | "usuarios" | "general" | "notificaciones" | "seguridad"

const NAV_ITEMS: { id: SettingsSection; title: string; icon: React.ReactNode }[] = [
  { id: "sitio", title: "Sitio Web & Diseño", icon: <GlobeIcon className="size-4 shrink-0" /> },
  { id: "catalogos", title: "Catálogos", icon: <LayersIcon className="size-4 shrink-0" /> },
  { id: "usuarios", title: "Usuarios", icon: <UsersIcon className="size-4 shrink-0" /> },
  { id: "general", title: "General", icon: <SlidersIcon className="size-4 shrink-0" /> },
  { id: "notificaciones", title: "Notificaciones", icon: <BellIcon className="size-4 shrink-0" /> },
  { id: "seguridad", title: "Seguridad", icon: <ShieldCheckIcon className="size-4 shrink-0" /> },
]

export function SettingsView() {
  const [activeSection, setActiveSection] = React.useState<SettingsSection>("sitio")
  const [open, setOpen] = React.useState(true)

  const activeItem = NAV_ITEMS.find((i) => i.id === activeSection)

  if (!open) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">
        <a href="/" className="underline">Volver al Dashboard</a>
      </div>
    )
  }

  return (
    <FullPageModal
      open={open}
      onClose={() => { window.location.href = "/" }}
      title="Ajustes"
      subtitle={activeItem?.title}
    >
      {/* Primary Sidebar nav */}
      <aside className="w-56 lg:w-64 border-r bg-muted/20 p-3 shrink-0 flex flex-col justify-between">
        <nav className="space-y-1">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
            Configuración
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.icon}
                <span>{item.title}</span>
              </button>
            )
          })}
        </nav>
        <div className="p-3 bg-muted/40 rounded-lg border text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">Altario v1.0</p>
          <p className="mt-0.5">Panel de gestión parroquial</p>
        </div>
      </aside>

      {/* Main content area */}
      <main className={`flex-1 overflow-y-auto min-w-0 ${activeSection === "catalogos" ? "p-0 h-full" : "p-4 lg:p-6"}`}>
        {activeSection === "sitio" && <SitioSettings />}
        {activeSection === "catalogos" && <CatalogosSettings />}
        {activeSection === "usuarios" && <UsuariosSettings />}
        {activeSection === "general" && <GeneralSettings />}
        {activeSection === "notificaciones" && <NotificacionesSettings />}
        {activeSection === "seguridad" && <SeguridadSettings />}
      </main>
    </FullPageModal>
  )
}

function NotificacionesSettings() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-base font-semibold">Notificaciones</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Configurá cómo recibís alertas de nuevos mensajes.</p>
      </div>
      <div className="space-y-3">
        {[
          { label: "Nuevo mensaje recibido", desc: "Recibirás un email cuando alguien complete el formulario de contacto." },
          { label: "Resumen semanal", desc: "Un resumen de actividad cada lunes." },
        ].map((item) => (
          <div key={item.label} className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-card">
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
            <input type="checkbox" defaultChecked className="mt-0.5 size-4 accent-foreground cursor-pointer" />
          </div>
        ))}
      </div>
      <SaveButton />
    </div>
  )
}

function SeguridadSettings() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-base font-semibold">Seguridad</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Cambiá tu contraseña de acceso.</p>
      </div>
      <div className="grid gap-4">
        <FieldRow label="Contraseña actual">
          <input type="password" className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none" placeholder="••••••••" />
        </FieldRow>
        <FieldRow label="Nueva contraseña">
          <input type="password" className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none" placeholder="Mínimo 8 caracteres" />
        </FieldRow>
        <FieldRow label="Confirmar contraseña">
          <input type="password" className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none" placeholder="Repetir contraseña" />
        </FieldRow>
      </div>
      <SaveButton label="Actualizar Contraseña" />
    </div>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  )
}

function SaveButton({ label = "Guardar Cambios" }: { label?: string }) {
  const [saved, setSaved] = React.useState(false)
  return (
    <div className="flex items-center gap-3 pt-2">
      {saved && <span className="text-xs text-muted-foreground flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-emerald-500 inline-block" />Guardado</span>}
      <button
        onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500) }}
        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
      >
        {label}
      </button>
    </div>
  )
}
