"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  getLocalConfig,
  fetchSiteConfigFromDb,
  saveFullSiteConfig,
  type SiteConfig,
} from "@/lib/config"
import {
  ChurchIcon,
  UserIcon,
  MapPinIcon,
  Share2Icon,
  PaletteIcon,
  CheckIcon,
  GlobeIcon,
  UploadIcon,
} from "lucide-react"

type TabKey = "identidad" | "parroco" | "contacto" | "redes" | "apariencia"

const TABS: { id: TabKey; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "identidad", label: "Identidad y logo", icon: <ChurchIcon className="size-4" />, desc: "Nombre, diócesis, lema y escudo o monograma" },
  { id: "parroco", label: "Párroco", icon: <UserIcon className="size-4" />, desc: "Información pastoral y datos del párroco" },
  { id: "contacto", label: "Contacto y ubicación", icon: <MapPinIcon className="size-4" />, desc: "Dirección, teléfonos, WhatsApp y secretaría" },
  { id: "redes", label: "Redes sociales", icon: <Share2Icon className="size-4" />, desc: "Enlaces a perfiles oficiales y canales" },
  { id: "apariencia", label: "Diseño y colores", icon: <PaletteIcon className="size-4" />, desc: "Colores principales, banners y estilos visuales" },
]

export function SitioSettings() {
  const [activeTab, setActiveTab] = React.useState<TabKey>("identidad")
  const [config, setConfig] = React.useState<SiteConfig>(getLocalConfig())
  const [saving, setSaving] = React.useState(false)
  const [savedSuccess, setSavedSuccess] = React.useState(false)

  React.useEffect(() => {
    fetchSiteConfigFromDb().then((data) => {
      setConfig(data)
    })
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await saveFullSiteConfig(config)
    setSaving(false)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  const updateSection = <K extends keyof SiteConfig>(
    section: K,
    key: keyof SiteConfig[K],
    value: any
  ) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }))
  }

  const currentTabInfo = TABS.find((t) => t.id === activeTab)

  return (
    <form onSubmit={handleSave} className="flex flex-col h-full min-h-full">
      {/* ─── Header bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 shrink-0">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Configuración del sitio web
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Personalizá la información, identidad y apariencia visual que ven los fieles en la web pública.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {savedSuccess && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 animate-in fade-in duration-200">
              <span className="size-2 rounded-full bg-emerald-500" />
              Cambios guardados
            </span>
          )}
          <Button
            type="submit"
            disabled={saving}
            size="sm"
            className="gap-1.5 cursor-pointer"
          >
            {saving ? (
              "Guardando..."
            ) : (
              <>
                <CheckIcon className="size-4" />
                Guardar cambios
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ─── Horizontal Tabs Navigation ─── */}
      <div className="flex items-center gap-1 border-b py-2 overflow-x-auto shrink-0 scrollbar-none">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-foreground text-background shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ─── Tab Content Body ─── */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 max-w-3xl">
        {/* TAB 1: IDENTIDAD Y LOGO */}
        {activeTab === "identidad" && (
          <div className="space-y-6">
            <Card className="p-4 sm:p-5">
              <CardContent className="p-0 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Datos institucionales</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Nombre oficial de la parroquia</Label>
                    <Input
                      required
                      value={config.parroquia.nombre}
                      onChange={(e) => updateSection("parroquia", "nombre", e.target.value)}
                      placeholder="Ej: Parroquia Santa María de la Ayuda"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label className="text-xs">Diócesis / Arquidiócesis</Label>
                    <Input
                      value={config.parroquia.diocesis}
                      onChange={(e) => updateSection("parroquia", "diocesis", e.target.value)}
                      placeholder="Ej: Diócesis de Buenos Aires"
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs">Lema o frase pastoral</Label>
                  <Input
                    value={config.parroquia.lema}
                    onChange={(e) => updateSection("parroquia", "lema", e.target.value)}
                    placeholder="Ej: Una comunidad de fe, esperanza y caridad"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs">Descripción general / reseña breve</Label>
                  <Textarea
                    rows={3}
                    value={config.parroquia.descripcion}
                    onChange={(e) => updateSection("parroquia", "descripcion", e.target.value)}
                    placeholder="Breve reseña que describe la misión y comunidad parroquial..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="p-4 sm:p-5">
              <CardContent className="p-0 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Escudo y logotipo</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                  <div className="space-y-4">
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Tipo de logo</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => updateSection("parroquia", "logo_tipo", "monograma")}
                          className={`p-2.5 rounded-lg border text-xs text-start transition-all cursor-pointer ${
                            config.parroquia.logo_tipo === "monograma"
                              ? "border-foreground bg-accent/60 font-semibold text-foreground"
                              : "border-border hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          Monograma / Iniciales
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSection("parroquia", "logo_tipo", "imagen")}
                          className={`p-2.5 rounded-lg border text-xs text-start transition-all cursor-pointer ${
                            config.parroquia.logo_tipo === "imagen"
                              ? "border-foreground bg-accent/60 font-semibold text-foreground"
                              : "border-border hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          Imagen / Escudo URL
                        </button>
                      </div>
                    </div>

                    {config.parroquia.logo_tipo === "monograma" ? (
                      <div className="grid gap-1.5">
                        <Label className="text-xs">Iniciales del monograma (máx 3 letras)</Label>
                        <Input
                          maxLength={3}
                          className="uppercase font-serif"
                          value={config.parroquia.logo_iniciales}
                          onChange={(e) => updateSection("parroquia", "logo_iniciales", e.target.value.toUpperCase())}
                          placeholder="AM"
                        />
                      </div>
                    ) : (
                      <div className="grid gap-1.5">
                        <Label className="text-xs">URL o ruta de la imagen del escudo</Label>
                        <Input
                          value={config.parroquia.logo_url}
                          onChange={(e) => updateSection("parroquia", "logo_url", e.target.value)}
                          placeholder="/assets/img/escudo.png o https://..."
                        />
                      </div>
                    )}
                  </div>

                  {/* Live Preview */}
                  <div className="p-4 rounded-xl border bg-muted/20 flex flex-col items-center justify-center text-center gap-3">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Vista previa en cabecera
                    </span>
                    <div className="flex items-center gap-3 p-3 bg-background rounded-lg border shadow-xs">
                      {config.parroquia.logo_tipo === "imagen" && config.parroquia.logo_url ? (
                        <img
                          src={config.parroquia.logo_url}
                          alt="Escudo"
                          className="size-11 object-contain rounded-full border"
                        />
                      ) : (
                        <div
                          className="size-11 rounded-full flex items-center justify-center font-serif text-sm font-bold shadow-inner"
                          style={{
                            backgroundColor: config.apariencia.color_primario,
                            color: config.apariencia.color_acento,
                            border: `2px solid ${config.apariencia.color_acento}`,
                          }}
                        >
                          {config.parroquia.logo_iniciales || "AM"}
                        </div>
                      )}
                      <div className="text-left">
                        <p className="text-xs font-bold text-foreground">
                          {config.parroquia.nombre || "Nombre de Parroquia"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Parroquia</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: PÁRROCO */}
        {activeTab === "parroco" && (
          <Card className="p-4 sm:p-5">
            <CardContent className="p-0 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Información del párroco y sacerdotes</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Estos datos aparecen en las páginas de Contacto y Comunidad para la atención espiritual.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Nombre completo</Label>
                  <Input
                    value={config.parroco.nombre}
                    onChange={(e) => updateSection("parroco", "nombre", e.target.value)}
                    placeholder="Ej: Padre Martín Morales"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs">Título / Cargo</Label>
                  <Input
                    value={config.parroco.titulo}
                    onChange={(e) => updateSection("parroco", "titulo", e.target.value)}
                    placeholder="Ej: Párroco / Vicario Parroquial"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs">Correo pastoral</Label>
                  <Input
                    type="email"
                    value={config.parroco.email}
                    onChange={(e) => updateSection("parroco", "email", e.target.value)}
                    placeholder="parroco@parroquia.org"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs">Teléfono pastoral (urgencias)</Label>
                  <Input
                    value={config.parroco.telefono}
                    onChange={(e) => updateSection("parroco", "telefono", e.target.value)}
                    placeholder="+54 11 4000-0001"
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">Foto del párroco (URL o ruta)</Label>
                <Input
                  value={config.parroco.foto_url}
                  onChange={(e) => updateSection("parroco", "foto_url", e.target.value)}
                  placeholder="/assets/img/patrona.jpg"
                />
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">Mensaje pastoral / Biografía breve</Label>
                <Textarea
                  rows={3}
                  value={config.parroco.biografia}
                  onChange={(e) => updateSection("parroco", "biografia", e.target.value)}
                  placeholder="Mensaje de bienvenida a la comunidad o resumen biográfico..."
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB 3: CONTACTO Y UBICACIÓN */}
        {activeTab === "contacto" && (
          <Card className="p-4 sm:p-5">
            <CardContent className="p-0 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Canales de contacto y secretaría</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Información mostrada en el pie de página, cabecera y sección de Contacto.
                </p>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">Dirección física</Label>
                <Input
                  value={config.contacto.direccion}
                  onChange={(e) => updateSection("contacto", "direccion", e.target.value)}
                  placeholder="Calle, número, esquina, ciudad"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Teléfono fijo</Label>
                  <Input
                    value={config.contacto.telefono}
                    onChange={(e) => updateSection("contacto", "telefono", e.target.value)}
                    placeholder="+54 11 4000-0000"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs">WhatsApp oficial</Label>
                  <Input
                    value={config.contacto.whatsapp}
                    onChange={(e) => updateSection("contacto", "whatsapp", e.target.value)}
                    placeholder="+5491140000000"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs">Correo de secretaría</Label>
                  <Input
                    type="email"
                    value={config.contacto.email}
                    onChange={(e) => updateSection("contacto", "email", e.target.value)}
                    placeholder="contacto@parroquia.org"
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">Horarios de atención en secretaría</Label>
                <Input
                  value={config.contacto.horario_secretaria}
                  onChange={(e) => updateSection("contacto", "horario_secretaria", e.target.value)}
                  placeholder="Lun a vie 9:00 – 12:00 y 16:00 – 19:00 | Sábados 9:00 – 12:00"
                />
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">Cómo llegar (transporte público y referencias)</Label>
                <Textarea
                  rows={2}
                  value={config.contacto.como_llegar}
                  onChange={(e) => updateSection("contacto", "como_llegar", e.target.value)}
                  placeholder="Líneas de colectivo, estaciones de tren o subte cercanas..."
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB 4: REDES SOCIALES */}
        {activeTab === "redes" && (
          <Card className="p-4 sm:p-5">
            <CardContent className="p-0 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Redes sociales oficiales</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Los enlaces que dejes en blanco se ocultarán automáticamente en la web.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Facebook (URL completa)</Label>
                  <Input
                    value={config.redes.facebook}
                    onChange={(e) => updateSection("redes", "facebook", e.target.value)}
                    placeholder="https://facebook.com/tuparroquia"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs">Instagram (URL completa)</Label>
                  <Input
                    value={config.redes.instagram}
                    onChange={(e) => updateSection("redes", "instagram", e.target.value)}
                    placeholder="https://instagram.com/tuparroquia"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs">YouTube (Canal de misas / transmisiones)</Label>
                  <Input
                    value={config.redes.youtube}
                    onChange={(e) => updateSection("redes", "youtube", e.target.value)}
                    placeholder="https://youtube.com/@tuparroquia"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs">WhatsApp Link directo</Label>
                  <Input
                    value={config.redes.whatsapp}
                    onChange={(e) => updateSection("redes", "whatsapp", e.target.value)}
                    placeholder="https://wa.me/5491140000000"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs">Spotify / Podcast de homilías</Label>
                  <Input
                    value={config.redes.spotify}
                    onChange={(e) => updateSection("redes", "spotify", e.target.value)}
                    placeholder="https://open.spotify.com/show/..."
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs">X (Twitter)</Label>
                  <Input
                    value={config.redes.twitter}
                    onChange={(e) => updateSection("redes", "twitter", e.target.value)}
                    placeholder="https://x.com/tuparroquia"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB 5: APARIENCIA Y COLORES */}
        {activeTab === "apariencia" && (
          <Card className="p-4 sm:p-5">
            <CardContent className="p-0 space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Paleta visual y colores del sitio</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ajustá los tonos cromáticos principales de la web parroquial.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label className="text-xs">Color primario (Azul marino / Fondo)</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="size-8 rounded border border-border cursor-pointer"
                      value={config.apariencia.color_primario}
                      onChange={(e) => updateSection("apariencia", "color_primario", e.target.value)}
                    />
                    <Input
                      className="font-mono text-xs h-8 uppercase"
                      value={config.apariencia.color_primario}
                      onChange={(e) => updateSection("apariencia", "color_primario", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs">Color de acento (Oro / Detalles)</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="size-8 rounded border border-border cursor-pointer"
                      value={config.apariencia.color_acento}
                      onChange={(e) => updateSection("apariencia", "color_acento", e.target.value)}
                    />
                    <Input
                      className="font-mono text-xs h-8 uppercase"
                      value={config.apariencia.color_acento}
                      onChange={(e) => updateSection("apariencia", "color_acento", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs">Fondo de portada (Hero)</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="size-8 rounded border border-border cursor-pointer"
                      value={config.apariencia.color_fondo_hero}
                      onChange={(e) => updateSection("apariencia", "color_fondo_hero", e.target.value)}
                    />
                    <Input
                      className="font-mono text-xs h-8 uppercase"
                      value={config.apariencia.color_fondo_hero}
                      onChange={(e) => updateSection("apariencia", "color_fondo_hero", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Theme Preview Card */}
              <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Muestra de contraste
                </span>
                <div
                  className="p-5 rounded-lg text-center flex flex-col items-center justify-center gap-2 shadow-sm transition-colors"
                  style={{ backgroundColor: config.apariencia.color_fondo_hero, color: "#FFFFFF" }}
                >
                  <span
                    className="text-xs font-serif font-bold uppercase tracking-widest"
                    style={{ color: config.apariencia.color_acento }}
                  >
                    Parroquia {config.parroquia.nombre || "Santa María de la Ayuda"}
                  </span>
                  <p className="text-sm font-medium opacity-90">
                    "{config.parroquia.lema || "Una comunidad de fe y esperanza"}"
                  </p>
                  <button
                    type="button"
                    className="mt-2 px-3 py-1 rounded-md text-xs font-semibold shadow-xs"
                    style={{
                      backgroundColor: config.apariencia.color_acento,
                      color: config.apariencia.color_primario,
                    }}
                  >
                    Botón de muestra
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </form>
  )
}
