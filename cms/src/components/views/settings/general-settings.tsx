"use client"

import * as React from "react"

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
        type="button"
        onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500) }}
        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
      >
        {label}
      </button>
    </div>
  )
}

export function GeneralSettings() {
  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-base font-semibold">Redes Sociales</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Links que aparecen en el footer de la web pública.</p>
      </div>
      <div className="grid gap-4">
        <FieldRow label="Facebook">
          <input className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none" defaultValue="https://facebook.com/parroquiasantamaria" />
        </FieldRow>
        <FieldRow label="Instagram">
          <input className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none" defaultValue="https://instagram.com/parroquiasantamaria" />
        </FieldRow>
        <FieldRow label="YouTube">
          <input className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none" placeholder="https://youtube.com/..." />
        </FieldRow>
        <FieldRow label="WhatsApp">
          <input className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none" defaultValue="+5491140000000" />
        </FieldRow>
      </div>
      <SaveButton />

      <hr className="border-border" />

      <div>
        <h2 className="text-base font-semibold">Apariencia</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Preferencias visuales del panel de administración.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => { document.documentElement.classList.remove("dark"); localStorage.setItem("theme", "light") }}
          className="flex items-center justify-center gap-2 rounded-md border border-border bg-background py-3 text-sm font-medium hover:bg-muted transition-colors"
        >
          ☀️ Claro
        </button>
        <button
          type="button"
          onClick={() => { document.documentElement.classList.add("dark"); localStorage.setItem("theme", "dark") }}
          className="flex items-center justify-center gap-2 rounded-md border border-border bg-background py-3 text-sm font-medium hover:bg-muted transition-colors"
        >
          🌙 Oscuro
        </button>
      </div>
    </div>
  )
}
