"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import seedConfig from "@/data/seeds/configuracion.json"
import {
  getLocalConfig,
  fetchSiteConfigFromDb,
  saveFullSiteConfig,
  type SiteConfig,
} from "@/lib/config"
import { ImageUpload } from "@/components/ui/image-upload"
import { CheckIcon } from "lucide-react"

type TabKey = "identidad" | "parroco" | "contacto" | "redes" | "apariencia" | "dominio"

const TABS: { id: TabKey; label: string }[] = [
  { id: "identidad", label: "Identidad y logo" },
  { id: "parroco", label: "Párroco" },
  { id: "contacto", label: "Contacto y ubicación" },
  { id: "redes", label: "Redes sociales" },
  { id: "apariencia", label: "Diseño y colores" },
  { id: "dominio", label: "Dominio" },
]

export function SitioSettings() {
  const [activeTab, setActiveTab] = React.useState<TabKey>("identidad")
  const [config, setConfig] = React.useState<SiteConfig>(seedConfig as unknown as SiteConfig)
  const [mounted, setMounted] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [savedSuccess, setSavedSuccess] = React.useState(false)
  const [linkingVercel, setLinkingVercel] = React.useState(false)
  const [vercelLinkedMessage, setVercelLinkedMessage] = React.useState<string | null>(null)

  const handleLinkVercel = async () => {
    setLinkingVercel(true)
    setVercelLinkedMessage(null)
    try {
      const res = await fetch("/api/vercel/link-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webDomain: config.dominio?.dominio_web,
          cmsDomain: config.dominio?.subdominio_cms,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setVercelLinkedMessage("¡Dominios agregados a Vercel exitosamente!")
      } else {
        setVercelLinkedMessage(data.error || "Error al vincular en Vercel")
      }
    } catch {
      setVercelLinkedMessage("Error de conexión al vincular en Vercel")
    }
    setLinkingVercel(false)
    setTimeout(() => setVercelLinkedMessage(null), 5000)
  }

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

    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const bc = new BroadcastChannel("altario:site_config_sync")
        bc.postMessage({ type: "CONFIG_UPDATED", config })
        bc.close()
      }
    } catch {}

    setSaving(false)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
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

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
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

        <div className="flex items-center gap-3 shrink-0">
          {savedSuccess && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Guardado
            </span>
          )}
          <Button type="submit" disabled={saving} size="sm" className="gap-1.5 cursor-pointer">
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

      {/* Tab Contents */}
      <div className="space-y-6 w-full">
        {/* 1. IDENTIDAD Y LOGO */}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Iniciales del monograma</Label>
                      <Input
                        maxLength={4}
                        value={config.parroquia.logo_iniciales}
                        onChange={(e) => updateSection("parroquia", "logo_iniciales", e.target.value.toUpperCase())}
                        placeholder="AM"
                      />
                      <span className="text-[11px] text-muted-foreground">
                        Se muestra como monograma clásico cuando no se use un escudo en imagen.
                      </span>
                    </div>
                  </div>

                  <div>
                    <ImageUpload
                      value={config.parroquia.logo_url}
                      onChange={(url) => {
                        updateSection("parroquia", "logo_url", url)
                        updateSection("parroquia", "logo_tipo", url ? "imagen" : "monograma")
                      }}
                      folder="logos"
                      label="Logo o Escudo oficial"
                      description="Subí el escudo en formato PNG transparente, SVG o JPG."
                      aspectRatio="square"
                      presets={[
                        { label: "Imagen patrona", url: "/assets/img/patrona.jpg" },
                        { label: "Rosetón histórico", url: "/assets/img/roseton.jpg" },
                      ]}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 2. PÁRROCO */}
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

              <div className="pt-2">
                <ImageUpload
                  value={config.parroco.foto_url}
                  onChange={(url) => updateSection("parroco", "foto_url", url)}
                  folder="parroco"
                  label="Foto oficial del sacerdote"
                  description="Fotografía oficial del párroco que se mostrará en la web."
                  aspectRatio="portrait"
                  presets={[
                    { label: "Foto Patrona", url: "/assets/img/patrona.jpg" },
                    { label: "Fachada", url: "/assets/img/fachada.jpg" },
                  ]}
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

        {/* 3. CONTACTO Y UBICACIÓN */}
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

        {/* 4. REDES SOCIALES */}
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

        {/* 5. DISEÑO Y COLORES */}
        {activeTab === "apariencia" && (
          <Card className="p-0">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Paleta de colores</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Color primario</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="size-8 rounded border border-border cursor-pointer shrink-0"
                      value={config.apariencia.color_primario}
                      onChange={(e) => updateSection("apariencia", "color_primario", e.target.value)}
                    />
                    <Input
                      value={config.apariencia.color_primario}
                      onChange={(e) => updateSection("apariencia", "color_primario", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs">Color de acento</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="size-8 rounded border border-border cursor-pointer shrink-0"
                      value={config.apariencia.color_acento}
                      onChange={(e) => updateSection("apariencia", "color_acento", e.target.value)}
                    />
                    <Input
                      value={config.apariencia.color_acento}
                      onChange={(e) => updateSection("apariencia", "color_acento", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs">Fondo portada</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="size-8 rounded border border-border cursor-pointer shrink-0"
                      value={config.apariencia.color_fondo_hero}
                      onChange={(e) => updateSection("apariencia", "color_fondo_hero", e.target.value)}
                    />
                    <Input
                      value={config.apariencia.color_fondo_hero}
                      onChange={(e) => updateSection("apariencia", "color_fondo_hero", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 6. DOMINIO */}
        {activeTab === "dominio" && (
          <div className="space-y-6">
            <Card className="p-0">
              <CardContent className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Configuración de dominios</h3>
                    <p className="text-xs text-muted-foreground">
                      Asigná las direcciones web oficiales y vincúlas con un solo clic.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={linkingVercel || !config.dominio?.dominio_web}
                    onClick={handleLinkVercel}
                    className="text-xs gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    {linkingVercel ? "Vinculando en Vercel..." : "Vincular dominios en Vercel"}
                  </Button>
                </div>

                {vercelLinkedMessage && (
                  <div className="text-xs p-2.5 rounded-md bg-muted text-foreground border">
                    {vercelLinkedMessage}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Dominio web principal</Label>
                    <Input
                      value={config.dominio?.dominio_web || ""}
                      onChange={(e) => updateSection("dominio", "dominio_web", e.target.value.toLowerCase().trim())}
                      placeholder="parroquiasma.org"
                    />
                    <span className="text-[11px] text-muted-foreground">
                      Dirección web para los fieles.
                    </span>
                  </div>

                  <div className="grid gap-1.5">
                    <Label className="text-xs">Subdominio del panel (CMS)</Label>
                    <Input
                      value={config.dominio?.subdominio_cms || ""}
                      onChange={(e) => updateSection("dominio", "subdominio_cms", e.target.value.toLowerCase().trim())}
                      placeholder="admin.parroquiasma.org"
                    />
                    <span className="text-[11px] text-muted-foreground">
                      Acceso administrativo.
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-0">
              <CardContent className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Registros DNS</h3>
                    <p className="text-xs text-muted-foreground">
                      Configurá estos registros en tu proveedor de dominio:
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[
                      { id: "vercel", label: "Vercel" },
                      { id: "cloudflare", label: "Cloudflare" },
                      { id: "netlify", label: "Netlify" },
                      { id: "custom", label: "VPS / Servidor" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => updateSection("dominio", "proveedor_hosting", p.id)}
                        className={`px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer ${
                          (config.dominio?.proveedor_hosting || "vercel") === p.id
                            ? "bg-accent text-accent-foreground font-semibold border-foreground"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Tipo</TableHead>
                        <TableHead className="w-32">Nombre</TableHead>
                        <TableHead>Valor / Destino</TableHead>
                        <TableHead className="text-right">Uso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {((currentProvider: string) => {
                        const domain = config.dominio?.dominio_web || "parroquia.org"
                        const prefix = domain.replace(/\./g, "-")
                        const rows = {
                          vercel: [
                            { tipo: "A", nombre: "@", valor: "76.76.21.21", uso: "Web principal" },
                            { tipo: "CNAME", nombre: "www", valor: "cname.vercel-dns.com", uso: "Redirección www" },
                            { tipo: "CNAME", nombre: "admin", valor: "cname.vercel-dns.com", uso: "Panel CMS" },
                          ],
                          cloudflare: [
                            { tipo: "CNAME", nombre: "@", valor: `${prefix}.pages.dev`, uso: "Web principal" },
                            { tipo: "CNAME", nombre: "www", valor: `${prefix}.pages.dev`, uso: "Redirección www" },
                            { tipo: "CNAME", nombre: "admin", valor: `${prefix}-cms.pages.dev`, uso: "Panel CMS" },
                          ],
                          netlify: [
                            { tipo: "A", nombre: "@", valor: "75.2.60.5", uso: "Web principal" },
                            { tipo: "CNAME", nombre: "www", valor: "altario-web.netlify.app", uso: "Redirección www" },
                            { tipo: "CNAME", nombre: "admin", valor: "altario-cms.netlify.app", uso: "Panel CMS" },
                          ],
                          custom: [
                            { tipo: "A", nombre: "@", valor: "IP_DE_TU_SERVIDOR", uso: "Web principal" },
                            { tipo: "A", nombre: "www", valor: "IP_DE_TU_SERVIDOR", uso: "Redirección www" },
                            { tipo: "A", nombre: "admin", valor: "IP_DE_TU_SERVIDOR", uso: "Panel CMS" },
                          ],
                        }[currentProvider] || []

                        return rows.map((r, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-semibold text-xs">{r.tipo}</TableCell>
                            <TableCell className="text-xs">{r.nombre}</TableCell>
                            <TableCell className="text-xs font-mono">{r.valor}</TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground">{r.uso}</TableCell>
                          </TableRow>
                        ))
                      })(config.dominio?.proveedor_hosting || "vercel")}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="p-0">
              <CardContent className="p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Google Search Console y Analytics</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Google Search Console</Label>
                    <Input
                      value={config.dominio?.google_search_console_id || ""}
                      onChange={(e) => updateSection("dominio", "google_search_console_id", e.target.value)}
                      placeholder="google-site-verification=..."
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label className="text-xs">Google Analytics (opcional)</Label>
                    <Input
                      value={config.dominio?.google_analytics_id || ""}
                      onChange={(e) => updateSection("dominio", "google_analytics_id", e.target.value)}
                      placeholder="G-XXXXXXXXXX"
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
