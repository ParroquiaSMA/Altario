"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import seedConfig from "@/data/seeds/configuracion.json"
import {
  getLocalConfig,
  fetchSiteConfigFromDb,
  saveFullSiteConfig,
  type SiteConfig,
} from "@/lib/config"
import { CheckIcon, CopyIcon, ExternalLinkIcon, GlobeIcon, ShieldCheckIcon } from "lucide-react"

type TabKey = "identidad" | "parroco" | "contacto" | "redes" | "apariencia" | "dominio"

const TABS: { id: TabKey; label: string }[] = [
  { id: "identidad", label: "Identidad y logo" },
  { id: "parroco", label: "Párroco" },
  { id: "contacto", label: "Contacto y ubicación" },
  { id: "redes", label: "Redes sociales" },
  { id: "apariencia", label: "Diseño y colores" },
  { id: "dominio", label: "Dominio y publicación" },
]

export function SitioSettings() {
  const [activeTab, setActiveTab] = React.useState<TabKey>("identidad")
  // Initialize with seedConfig so SSR and client initial render match 100%
  const [config, setConfig] = React.useState<SiteConfig>(seedConfig as unknown as SiteConfig)
  const [mounted, setMounted] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [savedSuccess, setSavedSuccess] = React.useState(false)
  const [copiedField, setCopiedField] = React.useState<string | null>(null)

  // On mount: load local storage, URL params, and DB
  React.useEffect(() => {
    setMounted(true)
    const local = getLocalConfig()
    setConfig(local)

    const params = new URLSearchParams(window.location.search)
    const tabParam = params.get("tab") as TabKey
    if (tabParam && TABS.some((t) => t.id === tabParam)) {
      setActiveTab(tabParam)
    }

    fetchSiteConfigFromDb().then((data) => {
      setConfig(data)
    })
  }, [])

  // Listen for browser back/forward navigation
  React.useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      const tabParam = params.get("tab") as TabKey
      if (tabParam && TABS.some((t) => t.id === tabParam)) {
        setActiveTab(tabParam)
      }
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  const handleTabChange = (tabId: TabKey) => {
    setActiveTab(tabId)
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.set("tab", tabId)
      window.history.replaceState(null, "", url.toString())
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await saveFullSiteConfig(config)

    // Broadcast change to other open tabs / Web via BroadcastChannel
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const bc = new BroadcastChannel("altario:site_config_sync")
        bc.postMessage({ type: "CONFIG_UPDATED", config })
        bc.close()
      }
    } catch {
      // BroadcastChannel optional fallback
    }

    setSaving(false)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(id)
    setTimeout(() => setCopiedField(null), 2000)
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

  if (!mounted) {
    return (
      <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6 opacity-60">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex gap-2">
            {TABS.map((t) => (
              <span key={t.id} className="px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground">
                {t.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const currentProvider = config.dominio?.proveedor_hosting || "vercel"
  const webDomain = config.dominio?.dominio_web || "santamariadelaayuda.org"
  const cmsSubdomain = config.dominio?.subdominio_cms || `admin.${webDomain}`

  const dnsRecords = {
    vercel: [
      { type: "A", host: "@", value: "76.76.21.21", note: "Apunta el dominio web principal a Vercel" },
      { type: "CNAME", host: "www", value: "cname.vercel-dns.com", note: "Redirección www" },
      { type: "CNAME", host: "admin", value: "cname.vercel-dns.com", note: "Apunta el panel CMS a Vercel" },
    ],
    cloudflare: [
      { type: "CNAME", host: "@", value: `${webDomain.replace(/\./g, "-")}.pages.dev`, note: "Páginas Cloudflare Web" },
      { type: "CNAME", host: "admin", value: `${webDomain.replace(/\./g, "-")}-cms.pages.dev`, note: "Páginas Cloudflare CMS" },
    ],
    netlify: [
      { type: "A", host: "@", value: "75.2.60.5", note: "Apunta a Netlify" },
      { type: "CNAME", host: "admin", value: "altario-cms.netlify.app", note: "Panel CMS en Netlify" },
    ],
    custom: [
      { type: "A", host: "@", value: "IP_DE_TU_SERVIDOR", note: "IP de tu servidor VPS / Nginx" },
      { type: "A", host: "admin", value: "IP_DE_TU_SERVIDOR", note: "IP de tu servidor para el CMS" },
    ],
  }[currentProvider] || []

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6">
      {/* ─── Top Toolbar with Tabs & Save Button ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        {/* Minimal Sub-nav Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Save button and status indicator */}
        <div className="flex items-center gap-3 shrink-0">
          {savedSuccess && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Guardado
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

      {/* ─── Tab Content Body ─── */}
      <div className="space-y-6 w-full">
        {/* TAB 1: IDENTIDAD Y LOGO */}
        {activeTab === "identidad" && (
          <div className="space-y-6">
            <Card className="p-0">
              <CardContent className="p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Datos institucionales</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Nombre oficial</Label>
                    <Input
                      required
                      value={config.parroquia.nombre}
                      onChange={(e) => updateSection("parroquia", "nombre", e.target.value)}
                      placeholder="Ej: Santa María de la Ayuda"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label className="text-xs">Diócesis</Label>
                    <Input
                      value={config.parroquia.diocesis}
                      onChange={(e) => updateSection("parroquia", "diocesis", e.target.value)}
                      placeholder="Ej: Diócesis de Buenos Aires"
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs">Lema pastoral</Label>
                  <Input
                    value={config.parroquia.lema}
                    onChange={(e) => updateSection("parroquia", "lema", e.target.value)}
                    placeholder="Ej: Una comunidad de fe, esperanza y caridad"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs">Descripción corta</Label>
                  <Textarea
                    rows={3}
                    value={config.parroquia.descripcion}
                    onChange={(e) => updateSection("parroquia", "descripcion", e.target.value)}
                    placeholder="Breve reseña que describe la misión parroquial..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="p-0">
              <CardContent className="p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Escudo y logotipo</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                  <div className="space-y-4">
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Tipo de logo</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => updateSection("parroquia", "logo_tipo", "monograma")}
                          className={`p-2 rounded-lg border text-xs text-start transition-all cursor-pointer ${
                            config.parroquia.logo_tipo === "monograma"
                              ? "border-foreground bg-accent/60 font-medium text-foreground"
                              : "border-border hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          Monograma / Iniciales
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSection("parroquia", "logo_tipo", "imagen")}
                          className={`p-2 rounded-lg border text-xs text-start transition-all cursor-pointer ${
                            config.parroquia.logo_tipo === "imagen"
                              ? "border-foreground bg-accent/60 font-medium text-foreground"
                              : "border-border hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          Imagen / Escudo URL
                        </button>
                      </div>
                    </div>

                    {config.parroquia.logo_tipo === "monograma" ? (
                      <div className="grid gap-1.5">
                        <Label className="text-xs">Iniciales (máx 3 letras)</Label>
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
                        <Label className="text-xs">URL de la imagen del escudo</Label>
                        <Input
                          value={config.parroquia.logo_url}
                          onChange={(e) => updateSection("parroquia", "logo_url", e.target.value)}
                          placeholder="/assets/img/escudo.png o https://..."
                        />
                      </div>
                    )}
                  </div>

                  {/* Live Preview */}
                  <div className="p-4 rounded-lg border bg-muted/10 flex flex-col items-center justify-center text-center gap-2">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Vista previa en cabecera
                    </span>
                    <div className="flex items-center gap-3 p-2.5 bg-background rounded-md border shadow-xs">
                      {config.parroquia.logo_tipo === "imagen" && config.parroquia.logo_url ? (
                        <img
                          src={config.parroquia.logo_url}
                          alt="Escudo"
                          className="size-10 object-contain rounded-full border"
                        />
                      ) : (
                        <div
                          className="size-10 rounded-full flex items-center justify-center font-serif text-xs font-bold"
                          style={{
                            backgroundColor: config.apariencia.color_primario,
                            color: config.apariencia.color_acento,
                            border: `1.5px solid ${config.apariencia.color_acento}`,
                          }}
                        >
                          {config.parroquia.logo_iniciales || "AM"}
                        </div>
                      )}
                      <div className="text-left">
                        <p className="text-xs font-semibold text-foreground">
                          {config.parroquia.nombre || "Nombre"}
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
          <Card className="p-0">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Información pastoral</h3>

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
                  <Label className="text-xs">Título o cargo</Label>
                  <Input
                    value={config.parroco.titulo}
                    onChange={(e) => updateSection("parroco", "titulo", e.target.value)}
                    placeholder="Ej: Párroco"
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
                  <Label className="text-xs">Teléfono pastoral</Label>
                  <Input
                    value={config.parroco.telefono}
                    onChange={(e) => updateSection("parroco", "telefono", e.target.value)}
                    placeholder="+54 11 4000-0001"
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">Foto (URL o ruta)</Label>
                <Input
                  value={config.parroco.foto_url}
                  onChange={(e) => updateSection("parroco", "foto_url", e.target.value)}
                  placeholder="/assets/img/patrona.jpg"
                />
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">Mensaje pastoral / Biografía</Label>
                <Textarea
                  rows={3}
                  value={config.parroco.biografia}
                  onChange={(e) => updateSection("parroco", "biografia", e.target.value)}
                  placeholder="Mensaje o reseña breve..."
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB 3: CONTACTO Y UBICACIÓN */}
        {activeTab === "contacto" && (
          <Card className="p-0">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Canales de contacto</h3>

              <div className="grid gap-1.5">
                <Label className="text-xs">Dirección</Label>
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
                  <Label className="text-xs">WhatsApp</Label>
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
                <Label className="text-xs">Horarios de secretaría</Label>
                <Input
                  value={config.contacto.horario_secretaria}
                  onChange={(e) => updateSection("contacto", "horario_secretaria", e.target.value)}
                  placeholder="Lun a vie 9:00 – 12:00 y 16:00 – 19:00 | Sábados 9:00 – 12:00"
                />
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">Cómo llegar</Label>
                <Textarea
                  rows={2}
                  value={config.contacto.como_llegar}
                  onChange={(e) => updateSection("contacto", "como_llegar", e.target.value)}
                  placeholder="Líneas de colectivo o referencias..."
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB 4: REDES SOCIALES */}
        {activeTab === "redes" && (
          <Card className="p-0">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Redes sociales</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Facebook</Label>
                  <Input
                    value={config.redes.facebook}
                    onChange={(e) => updateSection("redes", "facebook", e.target.value)}
                    placeholder="https://facebook.com/..."
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs">Instagram</Label>
                  <Input
                    value={config.redes.instagram}
                    onChange={(e) => updateSection("redes", "instagram", e.target.value)}
                    placeholder="https://instagram.com/..."
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs">YouTube</Label>
                  <Input
                    value={config.redes.youtube}
                    onChange={(e) => updateSection("redes", "youtube", e.target.value)}
                    placeholder="https://youtube.com/@..."
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs">WhatsApp Link</Label>
                  <Input
                    value={config.redes.whatsapp}
                    onChange={(e) => updateSection("redes", "whatsapp", e.target.value)}
                    placeholder="https://wa.me/..."
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs">Spotify / Podcast</Label>
                  <Input
                    value={config.redes.spotify}
                    onChange={(e) => updateSection("redes", "spotify", e.target.value)}
                    placeholder="https://open.spotify.com/..."
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs">X (Twitter)</Label>
                  <Input
                    value={config.redes.twitter}
                    onChange={(e) => updateSection("redes", "twitter", e.target.value)}
                    placeholder="https://x.com/..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB 5: APARIENCIA Y COLORES */}
        {activeTab === "apariencia" && (
          <Card className="p-0">
            <CardContent className="p-5 space-y-5">
              <h3 className="text-sm font-semibold text-foreground">Paleta de colores</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label className="text-xs">Color primario</Label>
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
                  <Label className="text-xs">Color de acento</Label>
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

              {/* Theme Preview */}
              <div className="p-4 rounded-lg border bg-muted/10 space-y-2">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Muestra de contraste
                </span>
                <div
                  className="p-5 rounded-md text-center flex flex-col items-center justify-center gap-2 shadow-xs transition-colors"
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

        {/* TAB 6: DOMINIO Y PUBLICACIÓN */}
        {activeTab === "dominio" && (
          <div className="space-y-6">
            <Card className="p-0">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <GlobeIcon className="size-4 text-primary" />
                      Dominios de publicación
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Configurá los dominios con los que los fieles y la administración accederán al sistema.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[11px] font-medium border border-emerald-200/60 dark:border-emerald-800/60">
                    <ShieldCheckIcon className="size-3.5" />
                    SSL / HTTPS Automático
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="grid gap-1.5">
                    <Label className="text-xs font-medium">Dominio de la Web Pública</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={config.dominio?.dominio_web || ""}
                        onChange={(e) => updateSection("dominio", "dominio_web", e.target.value.toLowerCase().trim())}
                        placeholder="santamariadelaayuda.org"
                        className="font-mono text-xs"
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      Dirección principal donde los fieles consultarán misas y sacramentos.
                    </span>
                  </div>

                  <div className="grid gap-1.5">
                    <Label className="text-xs font-medium">Subdominio del Panel CMS</Label>
                    <Input
                      value={config.dominio?.subdominio_cms || ""}
                      onChange={(e) => updateSection("dominio", "subdominio_cms", e.target.value.toLowerCase().trim())}
                      placeholder="admin.santamariadelaayuda.org"
                      className="font-mono text-xs"
                    />
                    <span className="text-[11px] text-muted-foreground">
                      Acceso exclusivo para el párroco y la secretaría parroquial.
                    </span>
                  </div>
                </div>

                <div className="grid gap-1.5 pt-2">
                  <Label className="text-xs font-medium">Proveedor de Alojamiento (Hosting)</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "vercel", label: "Vercel (Recomendado)", desc: "Serverless & Edge" },
                      { id: "cloudflare", label: "Cloudflare Pages", desc: "CDN Global" },
                      { id: "netlify", label: "Netlify", desc: "JAMstack" },
                      { id: "custom", label: "VPS Propio", desc: "Docker / Nginx" },
                    ].map((prov) => (
                      <button
                        key={prov.id}
                        type="button"
                        onClick={() => updateSection("dominio", "proveedor_hosting", prov.id)}
                        className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                          currentProvider === prov.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary font-medium text-foreground"
                            : "border-border hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        <p className="text-xs font-medium text-foreground">{prov.label}</p>
                        <p className="text-[10px] text-muted-foreground">{prov.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* DNS Records Card */}
            <Card className="p-0">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Registros DNS Requeridos ({currentProvider.toUpperCase()})
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Copiá y pegá estos registros en tu registrador de dominio (Cloudflare, GoDaddy, DonWeb, Namecheap, etc.).
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/50 border-b text-muted-foreground font-medium">
                      <tr>
                        <th className="py-2.5 px-3">Tipo</th>
                        <th className="py-2.5 px-3">Nombre / Host</th>
                        <th className="py-2.5 px-3">Valor / Destino</th>
                        <th className="py-2.5 px-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-mono">
                      {dnsRecords.map((rec, i) => (
                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-primary">{rec.type}</td>
                          <td className="py-2.5 px-3 text-foreground">{rec.host}</td>
                          <td className="py-2.5 px-3 text-muted-foreground select-all">{rec.value}</td>
                          <td className="py-2.5 px-3 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(rec.value, `dns-${i}`)}
                              className="h-7 px-2 text-[11px] font-sans gap-1 cursor-pointer"
                            >
                              {copiedField === `dns-${i}` ? (
                                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                                  <CheckIcon className="size-3" /> Copiado
                                </span>
                              ) : (
                                <>
                                  <CopyIcon className="size-3" /> Copiar
                                </>
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* SEO & Verificación */}
            <Card className="p-0">
              <CardContent className="p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">SEO y Google Search Console</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Código de verificación Google Search Console</Label>
                    <Input
                      value={config.dominio?.google_search_console_id || ""}
                      onChange={(e) => updateSection("dominio", "google_search_console_id", e.target.value)}
                      placeholder="google-site-verification=..."
                      className="font-mono text-xs"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label className="text-xs">ID de Google Analytics 4 (opcional)</Label>
                    <Input
                      value={config.dominio?.google_analytics_id || ""}
                      onChange={(e) => updateSection("dominio", "google_analytics_id", e.target.value)}
                      placeholder="G-XXXXXXXXXX"
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </form>
  )
}
