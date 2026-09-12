"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  ClockIcon,
  CalendarIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  ChurchIcon,
} from "lucide-react"
import { WORLD_COUNTRIES, getAllWorldTimezones } from "@/lib/geo-data"

export function GeneralSettings() {
  const allTimezones = useMemo(() => getAllWorldTimezones(), [])

  // Form states
  const [timezone, setTimezone] = useState("America/Montevideo")
  const [countryCode, setCountryCode] = useState("UY")
  const [city, setCity] = useState("Montevideo")
  const [customCity, setCustomCity] = useState("")
  const [isCustomCity, setIsCustomCity] = useState(false)
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY")
  const [timeFormat, setTimeFormat] = useState("24h")
  const [currency, setCurrency] = useState("UYU")

  // Parish info states
  const [nombreParroquia, setNombreParroquia] = useState("Parroquia Santa María de la Ayuda")
  const [diocesis, setDiocesis] = useState("Arquidiócesis de Montevideo")
  const [parroco, setParroco] = useState("Padre Raúl González SJ")
  const [email, setEmail] = useState("contacto@santamariadelaayuda.org")
  const [telefono, setTelefono] = useState("+598 2311 0540")
  const [direccion, setDireccion] = useState("Bogotá 3585 (esquina Prusia), Cerro, Montevideo")

  // Live Clock states
  const [liveTime, setLiveTime] = useState<string>("")
  const [liveDate, setLiveDate] = useState<string>("")

  // Save feedback
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null)

  // Cities for the currently selected country
  const currentCountry = useMemo(() => {
    return WORLD_COUNTRIES.find((c) => c.code === countryCode) || WORLD_COUNTRIES[0]
  }, [countryCode])

  const availableCities = currentCountry?.cities || []

  // Live ticking clock in selected timezone
  useEffect(() => {
    const updateClock = () => {
      try {
        const now = new Date()
        const tStr = now.toLocaleTimeString("es-UY", {
          timeZone: timezone,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: timeFormat === "12h",
        })
        const dStr = now.toLocaleDateString("es-UY", {
          timeZone: timezone,
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
        setLiveTime(tStr)
        setLiveDate(dStr.charAt(0).toUpperCase() + dStr.slice(1))
      } catch {
        setLiveTime("—")
        setLiveDate("—")
      }
    }

    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [timezone, timeFormat])

  const handleCountryChange = (cCode: string) => {
    const found = WORLD_COUNTRIES.find((c) => c.code === cCode)
    if (found) {
      setCountryCode(found.code)
      setCurrency(found.currency)
      setTimezone(found.defaultTz)
      const firstCity = found.cities[0] || "Principal"
      setCity(firstCity)
      setIsCustomCity(false)
    }
  }

  const handleCitySelect = (val: string) => {
    if (val === "__custom__") {
      setIsCustomCity(true)
      setCity(customCity || "")
    } else {
      setIsCustomCity(false)
      setCity(val)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFeedback(null)

    try {
      // Simulate save
      await new Promise((resolve) => setTimeout(resolve, 600))
      setFeedback({
        ok: true,
        message: "Configuración general guardada exitosamente.",
      })
      setTimeout(() => setFeedback(null), 4000)
    } catch {
      setFeedback({
        ok: false,
        message: "Ocurrió un error al guardar.",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 w-full overflow-hidden">
      {/* Static Full-Width Header */}
      <div className="w-full px-6 py-4 border-b border-border bg-background shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-medium tracking-tight text-foreground">Configuración General</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ajustes de zona horaria, ubicación y preferencias de operación parroquial.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 h-8 px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
        >
          {saving ? (
            <>
              <span className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <span>Guardar cambios</span>
          )}
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
        {feedback && (
          <div
            className={`p-2.5 rounded-md text-xs flex items-center gap-2 border transition-all ${
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
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 pb-8">
          {/* Card 1: Zona Horaria y Ubicación */}
          <div className="rounded-lg border bg-card p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <ClockIcon className="size-3.5 text-muted-foreground" />
                Zona Horaria y Ubicación
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Zona horaria</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full h-8 rounded-md border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                  >
                    {allTimezones.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-medium">País</label>
                    <select
                      value={countryCode}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full h-8 rounded-md border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                    >
                      {WORLD_COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-medium">Ciudad</label>
                    {isCustomCity ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          className="h-8 w-full rounded-md border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                          value={customCity}
                          onChange={(e) => {
                            setCustomCity(e.target.value)
                            setCity(e.target.value)
                          }}
                          placeholder="Escribir ciudad..."
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomCity(false)
                            setCity(availableCities[0] || "")
                          }}
                          className="text-[11px] text-muted-foreground hover:text-foreground underline px-1 cursor-pointer"
                        >
                          Lista
                        </button>
                      </div>
                    ) : (
                      <select
                        value={city}
                        onChange={(e) => handleCitySelect(e.target.value)}
                        className="w-full h-8 rounded-md border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                      >
                        {availableCities.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                        <option value="__custom__">+ Otra ciudad...</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Live Clock Card */}
              <div className="rounded-md border bg-muted/20 p-3 space-y-1.5 flex flex-col justify-center">
                <p className="text-[11px] text-muted-foreground font-medium">Hora actual en la comunidad</p>
                <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                  {liveTime || "00:00:00"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {liveDate || "Cargando fecha..."}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Formatos y Notación */}
          <div className="rounded-lg border bg-card p-4 space-y-3.5">
            <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <CalendarIcon className="size-3.5 text-muted-foreground" />
              Formatos y Moneda
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Formato de Fecha</label>
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="w-full h-8 rounded-md border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (Ej: 09/09/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (EE.UU.)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Formato de Hora</label>
                <select
                  value={timeFormat}
                  onChange={(e) => setTimeFormat(e.target.value)}
                  className="w-full h-8 rounded-md border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                >
                  <option value="24h">24 horas (Ej: 19:30)</option>
                  <option value="12h">12 horas (Ej: 07:30 PM)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Moneda de Donaciones</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full h-8 rounded-md border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                >
                  <option value="UYU">UYU — Peso Uruguayo ($)</option>
                  <option value="USD">USD — Dólar Estadounidense (US$)</option>
                  <option value="ARS">ARS — Peso Argentino ($)</option>
                  <option value="EUR">EUR — Euro (€)</option>
                  <option value="MXN">MXN — Peso Mexicano ($)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 3: Datos de la Parroquia */}
          <div className="rounded-lg border bg-card p-4 space-y-3.5">
            <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <ChurchIcon className="size-3.5 text-muted-foreground" />
              Identidad Parroquial
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Nombre de la Parroquia</label>
                <input
                  value={nombreParroquia}
                  onChange={(e) => setNombreParroquia(e.target.value)}
                  className="w-full h-8 rounded-md border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Diócesis / Jurisdicción</label>
                <input
                  value={diocesis}
                  onChange={(e) => setDiocesis(e.target.value)}
                  className="w-full h-8 rounded-md border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Párroco / Rector</label>
                <input
                  value={parroco}
                  onChange={(e) => setParroco(e.target.value)}
                  className="w-full h-8 rounded-md border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Email de Secretaría</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-8 rounded-md border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Teléfono / WhatsApp</label>
                <input
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full h-8 rounded-md border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Dirección del Templo</label>
                <input
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full h-8 rounded-md border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
