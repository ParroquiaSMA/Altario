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
import { uploadMediaFile } from "@/lib/storage"
import { ImageUpload } from "@/components/ui/image-upload"
import { marked } from "marked"
import {
  CheckIcon,
  PlusIcon,
  Edit3Icon,
  Trash2Icon,
  EllipsisVerticalIcon,
  BoldIcon,
  ItalicIcon,
  ListIcon,
  QuoteIcon,
  LinkIcon,
  ImageIcon,
  EyeIcon,
  CodeIcon,
  Share2Icon,
  GlobeIcon,
  ChurchIcon,
  BookOpenIcon,
  Loader2Icon,
  UserCheckIcon,
  MapPinIcon,
  HeartHandshakeIcon,
  PaletteIcon,
  SearchIcon,
} from "lucide-react"

type TabKey = "identidad" | "historia" | "parroco" | "contacto" | "redes" | "seo" | "apariencia" | "dominio"

interface TabMeta {
  id: TabKey
  label: string
  description: string
}

const TABS: TabMeta[] = [
  {
    id: "identidad",
    label: "Identidad y logo",
    description: "Datos institucionales, nombre de la parroquia, diócesis y logotipo oficial.",
  },
  {
    id: "historia",
    label: "Historia",
    description: "Relato histórico, hitos cronológicos y patrimonio de la comunidad.",
  },
  {
    id: "parroco",
    label: "Párroco",
    description: "Información pastoral del párroco a cargo, cargo y biografía.",
  },
  {
    id: "contacto",
    label: "Contacto y ubicación",
    description: "Ubicación geográfica, teléfonos de contacto, WhatsApp y horarios de secretaría.",
  },
  {
    id: "redes",
    label: "Redes sociales",
    description: "Enlaces a perfiles oficiales en redes sociales y canales de transmisión.",
  },
  {
    id: "seo",
    label: "SEO y Metadatos",
    description: "Favicon, imagen destacada para WhatsApp y título para buscadores.",
  },
  {
    id: "apariencia",
    label: "Diseño y colores",
    description: "Personalización de colores primarios y portada del sitio web.",
  },
  {
    id: "dominio",
    label: "Dominio",
    description: "Configuración del dominio web oficial y vinculación de hosting.",
  },
]

export function SitioSettings() {
  const [activeTab, setActiveTab] = React.useState<TabKey>("identidad")
  const [config, setConfig] = React.useState<SiteConfig>(seedConfig as unknown as SiteConfig)
  const [mounted, setMounted] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [savedSuccess, setSavedSuccess] = React.useState(false)
  const [linkingVercel, setLinkingVercel] = React.useState(false)
  const [vercelLinkedMessage, setVercelLinkedMessage] = React.useState<string | null>(null)

  const editorRef = React.useRef<HTMLDivElement | null>(null)
  const isEditingRef = React.useRef(false)

  // Sync content into visual WYSIWYG editor when config loads or tab opens
  React.useEffect(() => {
    if (editorRef.current && !isEditingRef.current) {
      const raw = config.historia?.contenido_markdown || ""
      const html = marked.parse(raw) as string
      if (editorRef.current.innerHTML !== html) {
        editorRef.current.innerHTML = html
      }
    }
  }, [config.historia?.contenido_markdown, mounted, activeTab])

  const handleEditorInput = () => {
    if (!editorRef.current) return
    isEditingRef.current = true
    const html = editorRef.current.innerHTML
    updateSection("historia", "contenido_markdown", html)
    setTimeout(() => {
      isEditingRef.current = false
    }, 300)
  }

  const formatText = (command: string, value: string | undefined = undefined) => {
    if (!editorRef.current) return
    editorRef.current.focus()
    document.execCommand(command, false, value)
    handleEditorInput()
  }

  const handleInsertLink = () => {
    const url = prompt("Ingresá la URL del enlace:", "https://")
    if (url) {
      formatText("createLink", url)
    }
  }

  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [isUploadingImage, setIsUploadingImage] = React.useState(false)

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingImage(true)
    try {
      const url = await uploadMediaFile(file, "galeria")
      formatText("insertImage", url)
    } catch (err) {
      console.error("Error al subir imagen a Supabase:", err)
    } finally {
      setIsUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleInsertImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleEditorPaste = async (e: React.ClipboardEvent) => {
    const file = e.clipboardData.files?.[0]
    if (file && file.type.startsWith("image/")) {
      e.preventDefault()
      setIsUploadingImage(true)
      try {
        const url = await uploadMediaFile(file, "galeria")
        formatText("insertImage", url)
      } catch (err) {
        console.error("Error al pegar imagen:", err)
      } finally {
        setIsUploadingImage(false)
      }
    }
  }

  const handleEditorDrop = async (e: React.DragEvent) => {
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) {
      e.preventDefault()
      setIsUploadingImage(true)
      try {
        const url = await uploadMediaFile(file, "galeria")
        formatText("insertImage", url)
      } catch (err) {
        console.error("Error al arrastrar imagen:", err)
      } finally {
        setIsUploadingImage(false)
      }
    }
  }

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

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaving(true)
    await saveFullSiteConfig(config)

    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const bc = new BroadcastChannel("altario:site_config_sync")
        bc.postMessage({ type: "CONFIG_UPDATED", config })
        bc.close()
      }
    } catch { }

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

  const currentTab = TABS.find((t) => t.id === activeTab) || TABS[0]

  if (!mounted) {
    return (
      <div className="flex flex-col md:flex-row min-h-full h-full items-stretch opacity-60">
        <aside className="w-full md:w-56 lg:w-64 shrink-0 border-r bg-muted/10 p-4 lg:p-6 space-y-4">
          <div className="space-y-1">
            {TABS.map((t) => (
              <div key={t.id} className="h-8 rounded-md bg-muted/40" />
            ))}
          </div>
        </aside>
        <main className="flex-1 p-6" />
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row h-full min-h-0 items-stretch overflow-hidden flex-1">
      {/* ─── Left Sub-Sidebar ─── */}
      <aside className="w-full md:w-56 lg:w-64 shrink-0 border-r bg-muted/10 p-4 lg:p-6 flex flex-col overflow-y-auto h-full min-h-0">
        <div className="space-y-4">

          <nav className="space-y-1">
            {TABS.map((tab) => {
              const isSelected = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${isSelected
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* ─── Right Content Panel ─── */}
      <main className="flex-1 w-full min-w-0 p-4 lg:p-6 space-y-6 overflow-y-auto h-full min-h-0">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 min-h-[57px]">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {currentTab.label}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {currentTab.description}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {savedSuccess && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Guardado
              </span>
            )}
            <Button
              type="button"
              onClick={handleSave}
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

        {/* Tab Contents */}
        <div className="space-y-6 max-w-4xl">
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
                  <ImageUpload
                    value={config.parroquia.logo_url}
                    onChange={(url) => {
                      const next: SiteConfig = {
                        ...config,
                        parroquia: {
                          ...config.parroquia,
                          logo_url: url,
                          logo_tipo: (url ? "imagen" : "monograma") as "imagen" | "monograma",
                        },
                      }
                      setConfig(next)
                      saveFullSiteConfig(next)
                    }}
                    onRemove={() => {
                      const next: SiteConfig = {
                        ...config,
                        parroquia: {
                          ...config.parroquia,
                          logo_url: "",
                          logo_tipo: "monograma" as const,
                        },
                      }
                      setConfig(next)
                      saveFullSiteConfig(next)
                    }}
                    folder="logos"
                    label="Escudo o logotipo oficial"
                    description="Subí el escudo oficial de la parroquia. Si no hay imagen, la web creará un monograma con las iniciales automáticamente."
                    aspectRatio="square"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* HISTORIA */}
          {activeTab === "historia" && (
            <div className="space-y-6">
              <Card className="p-0">
                <CardContent className="p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Página de Historia</h3>
                    <p className="text-xs text-muted-foreground">
                      Editá el relato fundacional, hitos cronológicos, sacerdotes históricos y patrimonio de la parroquia.
                    </p>
                  </div>

                  <div className="grid gap-1.5">
                    <Label className="text-xs">Título principal de la portada</Label>
                    <Input
                      value={config.historia?.titulo || ""}
                      onChange={(e) => updateSection("historia", "titulo", e.target.value)}
                      placeholder="Ej: Setenta y ocho años en la misma esquina"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label className="text-xs">Bajada / Resumen destacado</Label>
                    <Textarea
                      rows={2}
                      value={config.historia?.bajada || ""}
                      onChange={(e) => updateSection("historia", "bajada", e.target.value)}
                      placeholder="Breve resumen que introduce la historia en el encabezado..."
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="p-0">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between border-b pb-3">
                    <Label className="text-xs font-semibold">Contenido de la historia</Label>
                  </div>

                  {/* Barra de herramientas visual */}
                  <div className="flex flex-wrap items-center gap-1 p-1 rounded-md bg-muted/40 border">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => formatText("formatBlock", "<h2>")}
                      className="h-7 px-2 text-xs font-bold"
                      title="Título de sección (H2)"
                    >
                      H2
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => formatText("formatBlock", "<h3>")}
                      className="h-7 px-2 text-xs font-bold"
                      title="Subtítulo (H3)"
                    >
                      H3
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => formatText("formatBlock", "<p>")}
                      className="h-7 px-2 text-xs font-medium text-muted-foreground"
                      title="Párrafo normal"
                    >
                      Párrafo
                    </Button>
                    <div className="w-[1px] h-4 bg-border mx-0.5" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => formatText("bold")}
                      className="h-7 px-2"
                      title="Negrita"
                    >
                      <BoldIcon className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => formatText("italic")}
                      className="h-7 px-2"
                      title="Cursiva"
                    >
                      <ItalicIcon className="size-3.5" />
                    </Button>
                    <div className="w-[1px] h-4 bg-border mx-0.5" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => formatText("insertUnorderedList")}
                      className="h-7 px-2"
                      title="Lista de viñetas"
                    >
                      <ListIcon className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => formatText("formatBlock", "<blockquote>")}
                      className="h-7 px-2"
                      title="Cita destacada"
                    >
                      <QuoteIcon className="size-3.5" />
                    </Button>
                    <div className="w-[1px] h-4 bg-border mx-0.5" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleInsertLink}
                      className="h-7 px-2"
                      title="Insertar enlace"
                    >
                      <LinkIcon className="size-3.5" />
                    </Button>

                    {/* Subida de imágenes directa a Supabase */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleInsertImageClick}
                      disabled={isUploadingImage}
                      className="h-7 px-2 gap-1.5 text-xs cursor-pointer text-muted-foreground hover:text-foreground"
                      title="Subir foto"
                    >
                      {isUploadingImage ? (
                        <>
                          <Loader2Icon className="size-3.5 animate-spin text-primary" />
                          <span className="text-primary font-medium">Subiendo...</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="size-3.5" />
                          <span>Subir imagen</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Editor con visualización y estilos en vivo */}
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleEditorInput}
                    onPaste={handleEditorPaste}
                    onDrop={handleEditorDrop}
                    className="min-h-[380px] max-h-[620px] overflow-y-auto p-5 rounded-md border bg-card text-foreground text-sm space-y-3 focus:outline-none focus:ring-1 focus:ring-ring leading-relaxed [&>h2]:text-lg [&>h2]:font-bold [&>h2]:mt-5 [&>h2]:text-primary [&>h3]:text-base [&>h3]:font-semibold [&>h3]:mt-4 [&>p]:text-foreground [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1 [&>blockquote]:border-l-4 [&>blockquote]:border-primary/60 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-muted-foreground [&>blockquote]:my-3 [&>img]:rounded-md [&>img]:border [&>img]:my-3 [&>img]:max-h-72 [&>img]:object-cover [&>a]:text-primary [&>a]:underline"
                  />
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
                    onChange={(url) => {
                      const next: SiteConfig = {
                        ...config,
                        parroco: {
                          ...config.parroco,
                          foto_url: url,
                        },
                      }
                      setConfig(next)
                      saveFullSiteConfig(next)
                    }}
                    onRemove={() => {
                      const next: SiteConfig = {
                        ...config,
                        parroco: {
                          ...config.parroco,
                          foto_url: "",
                        },
                      }
                      setConfig(next)
                      saveFullSiteConfig(next)
                    }}
                    folder="parroco"
                    label="Foto oficial del sacerdote"
                    description="Fotografía oficial del párroco que se mostrará en la web."
                    aspectRatio="portrait"
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
                    placeholder="Líneas de transporte o referencias..."
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

          {/* SEO Y METADATOS */}
          {activeTab === "seo" && (
            <div className="space-y-6">
              <Card className="p-0">
                <CardContent className="p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Metadatos para Buscadores y Redes Sociales</h3>
                    <p className="text-xs text-muted-foreground">
                      Configurá cómo se muestra la parroquia en Google, WhatsApp, Facebook y Twitter cuando comparten tu enlace.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Título global del sitio (SEO)</Label>
                      <Input
                        value={config.seo?.titulo_sitio || ""}
                        onChange={(e) => updateSection("seo", "titulo_sitio", e.target.value)}
                        placeholder="Ej: Parroquia Santa María de la Ayuda — Montevideo"
                      />
                      <span className="text-[11px] text-muted-foreground">
                        Aparece en la pestaña del navegador y título en buscadores.
                      </span>
                    </div>

                    <div className="grid gap-1.5">
                      <Label className="text-xs">Palabras clave (Keywords)</Label>
                      <Input
                        value={config.seo?.palabras_clave || ""}
                        onChange={(e) => updateSection("seo", "palabras_clave", e.target.value)}
                        placeholder="Ej: parroquia, misa, bautismo, montevideo"
                      />
                      <span className="text-[11px] text-muted-foreground">
                        Términos separados por comas.
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Descripción para compartir (Meta Description)</Label>
                      <span className="text-[11px] text-muted-foreground">
                        {(config.seo?.descripcion || "").length}/160 caracteres
                      </span>
                    </div>
                    <Textarea
                      rows={3}
                      value={config.seo?.descripcion || ""}
                      onChange={(e) => updateSection("seo", "descripcion", e.target.value)}
                      placeholder="Breve resumen que aparece debajo del título en WhatsApp y Google..."
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-0">
                  <CardContent className="p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-foreground">Favicon de la web</h3>
                    <ImageUpload
                      value={config.seo?.favicon_url || ""}
                      onChange={(url) => {
                        const next: SiteConfig = {
                          ...config,
                          seo: {
                            ...config.seo,
                            favicon_url: url,
                          },
                        }
                        setConfig(next)
                        saveFullSiteConfig(next)
                      }}
                      onRemove={() => {
                        const next: SiteConfig = {
                          ...config,
                          seo: {
                            ...config.seo,
                            favicon_url: "",
                          },
                        }
                        setConfig(next)
                        saveFullSiteConfig(next)
                      }}
                      folder="logos"
                      label="Ícono de pestaña (Favicon)"
                      description="Ícono cuadrado (.ico, .png, .svg) que se ve en las pestañas del navegador."
                      aspectRatio="square"
                    />

                    <div className="pt-2">
                      <span className="text-xs font-medium text-muted-foreground block mb-1.5">Vista previa de pestaña:</span>
                      <div className="flex items-center gap-2 p-2 px-3 rounded-t-md bg-muted border border-b-0 w-fit text-xs">
                        {config.seo?.favicon_url ? (
                          <img src={config.seo.favicon_url} alt="Favicon" className="size-4 object-contain rounded-xs" />
                        ) : (
                          <GlobeIcon className="size-4 text-muted-foreground" />
                        )}
                        <span className="font-medium text-foreground truncate max-w-[180px]">
                          {config.seo?.titulo_sitio || config.parroquia.nombre}
                        </span>
                        <span className="text-[10px] text-muted-foreground">✕</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-0">
                  <CardContent className="p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-foreground">Imagen para compartir (Open Graph)</h3>
                    <ImageUpload
                      value={config.seo?.og_image_url || ""}
                      onChange={(url) => {
                        const next: SiteConfig = {
                          ...config,
                          seo: {
                            ...config.seo,
                            og_image_url: url,
                          },
                        }
                        setConfig(next)
                        saveFullSiteConfig(next)
                      }}
                      onRemove={() => {
                        const next: SiteConfig = {
                          ...config,
                          seo: {
                            ...config.seo,
                            og_image_url: "",
                          },
                        }
                        setConfig(next)
                        saveFullSiteConfig(next)
                      }}
                      folder="galeria"
                      label="Imagen destacada para redes"
                      description="Imagen que se visualiza automáticamente al enviar el link por WhatsApp o Facebook (Recomendado 1200x630)."
                      aspectRatio="video"
                    />

                    <div className="pt-2">
                      <span className="text-xs font-medium text-muted-foreground block mb-1.5">Vista previa al compartir en WhatsApp:</span>
                      <div className="border rounded-md overflow-hidden bg-card shadow-2xs max-w-sm">
                        {config.seo?.og_image_url ? (
                          <div className="h-32 w-full bg-muted overflow-hidden">
                            <img src={config.seo.og_image_url} alt="Vista previa" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-20 w-full bg-muted/50 flex items-center justify-center text-xs text-muted-foreground">
                            <Share2Icon className="size-5 opacity-40 mr-1.5" /> Sin imagen personalizada
                          </div>
                        )}
                        <div className="p-2.5 space-y-0.5 bg-muted/20">
                          <span className="text-[10px] uppercase text-muted-foreground block truncate">
                            {config.dominio?.dominio_web || "santamariadelaayuda.org"}
                          </span>
                          <h4 className="text-xs font-semibold text-foreground line-clamp-1">
                            {config.seo?.titulo_sitio || config.parroquia.nombre}
                          </h4>
                          <p className="text-[11px] text-muted-foreground line-clamp-2">
                            {config.seo?.descripcion || config.parroquia.descripcion}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
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
                          className={`px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer ${(config.dominio?.proveedor_hosting || "vercel") === p.id
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
      </main>
    </div>
  )
}

