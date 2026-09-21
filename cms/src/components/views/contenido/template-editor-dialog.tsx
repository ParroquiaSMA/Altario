import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  SearchIcon,
  PlusIcon,
  Trash2Icon,
  SlidersHorizontalIcon,
  CodeIcon,
  SettingsIcon,
  EyeIcon,
  SparklesIcon,
  CopyIcon,
  CheckIcon,
  RotateCcwIcon,
  RefreshCwIcon,
  InfoIcon,
} from "lucide-react"
import { extractVariables, renderTemplate, buildFullHtmlDocument, type VariableDefinicion } from "@/lib/html-template-engine"
import type { ContenidoPlantillaItem } from "@/lib/data-store"
import { cn } from "@/lib/utils"

const TIPO_LABELS: Record<string, string> = {
  text: "Texto corto",
  textarea: "Texto largo (área)",
  select: "Selector (desplegable)",
  color: "Color (paleta / picker)",
  image: "Imagen / Foto",
  number: "Número",
}

const CATEGORIAS = [
  { value: "redes", label: "Redes sociales" },
  { value: "liturgia", label: "Liturgia" },
  { value: "comunidad", label: "Comunidad" },
  { value: "historia", label: "Historia" },
  { value: "impresos", label: "Impresos" },
  { value: "web", label: "Web" },
  { value: "personalizado", label: "Personalizado" },
]

const PRESETS = [
  { label: "Vertical 4:5 (Post)", w: 1080, h: 1350, desc: "Instagram estándar" },
  { label: "Cuadrado 1:1", w: 1080, h: 1080, desc: "Feed cuadrado" },
  { label: "Historia 9:16", w: 1080, h: 1920, desc: "Historias y reels" },
]

interface TemplateEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingItem: ContenidoPlantillaItem | null
  onSave: (item: Omit<ContenidoPlantillaItem, "id">) => Promise<void>
}

export function TemplateEditorDialog({
  open,
  onOpenChange,
  editingItem,
  onSave,
}: TemplateEditorDialogProps) {
  const [activeTab, setActiveTab] = React.useState<"html" | "inputs" | "ajustes">("html")
  const [nombre, setNombre] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [descripcion, setDescripcion] = React.useState("")
  const [categoria, setCategoria] = React.useState("redes")
  const [anchoBase, setAnchoBase] = React.useState(1080)
  const [altoBase, setAltoBase] = React.useState(1350)
  const [htmlTemplate, setHtmlTemplate] = React.useState("")
  const [variables, setVariables] = React.useState<VariableDefinicion[]>([])
  const [saving, setSaving] = React.useState(false)
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null)
  const [zoomMode, setZoomMode] = React.useState<"auto" | "0.25" | "0.35" | "0.5">("auto")

  const previewContainerRef = React.useRef<HTMLDivElement>(null)
  const [containerDim, setContainerDim] = React.useState({ w: 480, h: 540 })

  // Sync state when editingItem changes or dialog opens
  React.useEffect(() => {
    if (editingItem) {
      setNombre(editingItem.nombre)
      setSlug(editingItem.slug)
      setDescripcion(editingItem.descripcion || "")
      setCategoria(editingItem.categoria || "redes")
      setAnchoBase(editingItem.ancho_base || 1080)
      setAltoBase(editingItem.alto_base || 1350)
      setHtmlTemplate(editingItem.html_template || "")
      setVariables(editingItem.variables || [])
    } else {
      setNombre("")
      setSlug("")
      setDescripcion("")
      setCategoria("redes")
      setAnchoBase(1080)
      setAltoBase(1350)
      setHtmlTemplate(`<div class="placa" style="background-color: {{color_fondo}}; color: {{color_texto}}; width: 1080px; height: 1350px; font-family: 'Lora', Georgia, serif; display: flex; flex-direction: column; padding: 100px; box-sizing: border-box;">
  <div style="font-size: 28px; font-weight: 600; letter-spacing: 5px; color: {{color_acento}};">{{etiqueta}}</div>
  <div style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 84px; font-weight: 600; margin-top: 40px; flex: 1;">{{titulo}}</div>
  <div style="font-size: 26px; font-weight: 600; color: {{color_acento}}; letter-spacing: 2px; border-top: 2px solid {{color_acento}}; padding-top: 20px; margin-top: auto;">{{pie}}</div>
</div>`)
      setVariables([
        { key: "etiqueta", label: "Etiqueta superior", tipo: "text", default_val: "AVISO" },
        { key: "titulo", label: "Título", tipo: "textarea", default_val: "Escribí acá el título de la placa" },
        { key: "pie", label: "Pie de página", tipo: "text", default_val: "Parroquia Santa María de la Ayuda" },
        { key: "color_fondo", label: "Color de fondo", tipo: "color", default_val: "#16244A" },
        { key: "color_texto", label: "Color de texto", tipo: "color", default_val: "#FFFFFF" },
        { key: "color_acento", label: "Color de acento", tipo: "color", default_val: "#C9A96A" },
      ])
    }
    setActiveTab("html")
  }, [editingItem, open])

  // Measure preview container
  React.useEffect(() => {
    if (!previewContainerRef.current) return
    const el = previewContainerRef.current
    const update = () => {
      setContainerDim({ w: el.clientWidth, h: el.clientHeight })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [open])

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40)
  }

  const handleNombreChange = (val: string) => {
    setNombre(val)
    if (!editingItem) {
      setSlug(generateSlug(val))
    }
  }

  // Scan variables from HTML and merge with existing
  const handleScanVariables = () => {
    const found = extractVariables(htmlTemplate)
    const existingMap = new Map(variables.map((v) => [v.key, v]))
    const merged: VariableDefinicion[] = found.map((key) => {
      if (existingMap.has(key)) {
        return existingMap.get(key)!
      }
      return {
        key,
        label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        tipo: key.includes("color")
          ? "color"
          : key.includes("foto") || key.includes("imagen") || key.includes("img")
            ? "image"
            : key.includes("lista") || key.includes("texto") || key.includes("detalle")
              ? "textarea"
              : "text",
        default_val: key.includes("color_fondo")
          ? "#16244A"
          : key.includes("color_texto")
            ? "#FFFFFF"
            : key.includes("color_acento")
              ? "#C9A96A"
              : "",
      }
    })
    setVariables(merged)
  }

  const updateVariable = (index: number, updates: Partial<VariableDefinicion>) => {
    setVariables((prev) =>
      prev.map((v, i) => (i === index ? { ...v, ...updates } : v))
    )
  }

  const removeVariable = (index: number) => {
    setVariables((prev) => prev.filter((_, i) => i !== index))
  }

  const addVariable = () => {
    setVariables((prev) => [
      ...prev,
      { key: `var_${prev.length + 1}`, label: "Nueva variable", tipo: "text", default_val: "", instruccion: "" },
    ])
  }

  const copyVariableTag = (key: string) => {
    navigator.clipboard.writeText(`{{${key}}}`)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  // Calculate live preview
  const previewValues = React.useMemo(() => {
    const vals: Record<string, string> = {}
    for (const v of variables) {
      vals[v.key] = v.default_val || `[${v.label || v.key}]`
    }
    return vals
  }, [variables])

  const renderedPreviewHtml = React.useMemo(() => {
    if (!htmlTemplate.trim()) return ""
    return renderTemplate(htmlTemplate, previewValues)
  }, [htmlTemplate, previewValues])

  // Scale calculation
  const paddingX = 40
  const paddingY = 40
  const availW = Math.max(200, containerDim.w - paddingX)
  const availH = Math.max(200, containerDim.h - paddingY)
  const autoScale = Math.min(availW / (anchoBase || 1080), availH / (altoBase || 1350))
  const currentScale = zoomMode === "auto" ? Math.min(autoScale, 0.45) : Number(zoomMode)

  const detectedKeys = React.useMemo(() => extractVariables(htmlTemplate), [htmlTemplate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || !slug.trim() || !htmlTemplate.trim()) {
      alert("Por favor completá el nombre, slug y plantilla HTML.")
      return
    }

    setSaving(true)
    try {
      await onSave({
        slug: slug.trim(),
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        categoria,
        ancho_base: anchoBase || 1080,
        alto_base: altoBase || 1350,
        html_template: htmlTemplate,
        variables,
        activo: true,
        orden: editingItem?.orden ?? 0,
      })
      onOpenChange(false)
    } catch (err: any) {
      console.error("[Contenido] Error al guardar plantilla:", err)
      alert("Error al guardar: " + (err.message || err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl! w-[96vw]! h-[92vh]! max-h-[92vh]! p-0! flex! flex-col! overflow-hidden! gap-0! rounded-xl!">
        {/* ── Top Header ────────────────────────────────────────── */}
        <div className="h-14 px-6 border-b border-border bg-card flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <DialogTitle className="text-sm font-semibold leading-tight">
                {editingItem ? `Editar plantilla: ${editingItem.nombre}` : "Nueva plantilla de contenido"}
              </DialogTitle>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{anchoBase} × {altoBase} px</span>
                <span>•</span>
                <span className="capitalize">{categoria}</span>
                <span>•</span>
                <span>{variables.length} variables</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pr-6">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleSubmit}
              disabled={saving}
              className="text-xs h-8 font-medium gap-1.5"
            >
              {saving ? "Guardando…" : editingItem ? "Guardar cambios" : "Crear plantilla"}
            </Button>
          </div>
        </div>

        {/* ── Main Split View ───────────────────────────────────── */}
        <div className="flex-1 grid min-h-0 overflow-hidden grid-cols-1 lg:grid-cols-[1fr_440px] xl:grid-cols-[1fr_480px] divide-y lg:divide-y-0 lg:divide-x border-border">
          {/* ── Left Column: Tabs & Editors ───────────────────── */}
          <div className="flex flex-col h-full min-h-0 overflow-hidden bg-card">
            {/* Tab Navigation Bar (Exact h-12 height to match right preview toolbar) */}
            <div className="h-12 px-4 border-b border-border bg-card flex items-center shrink-0">
              <div className="flex items-center p-1 rounded-lg bg-muted border border-border gap-1 w-full">
                <button
                  type="button"
                  onClick={() => setActiveTab("html")}
                  className={cn(
                    "flex-1 py-1 px-3 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5",
                    activeTab === "html"
                      ? "bg-background text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <CodeIcon className="size-3.5" />
                  <span>HTML & CSS</span>
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                    {detectedKeys.length}
                  </Badge>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("inputs")}
                  className={cn(
                    "flex-1 py-1 px-3 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5",
                    activeTab === "inputs"
                      ? "bg-background text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <SlidersHorizontalIcon className="size-3.5" />
                  <span>Variables / Inputs</span>
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                    {variables.length}
                  </Badge>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("ajustes")}
                  className={cn(
                    "flex-1 py-1 px-3 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5",
                    activeTab === "ajustes"
                      ? "bg-background text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <SettingsIcon className="size-3.5" />
                  <span>Ajustes</span>
                </button>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* ── TAB 1: HTML & CSS ── */}
              {activeTab === "html" && (
                <div className="flex flex-col gap-4 h-full">
                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-muted/40 border border-border">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleScanVariables}
                        className="text-xs h-7 gap-1"
                      >
                        <RefreshCwIcon className="size-3" />
                        Detectar variables
                      </Button>
                      <span className="text-[11px] text-muted-foreground">
                        {detectedKeys.length} detectadas en el código
                      </span>
                    </div>

                    <span className="text-[11px] text-muted-foreground">
                      Usá <code className="bg-background px-1 py-0.5 rounded border text-[11px]">{"{{variable}}"}</code>
                    </span>
                  </div>

                  {/* Variables pills (clickable to copy tag) */}
                  {detectedKeys.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-muted-foreground">
                        Variables encontradas (clic para copiar):
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
                        {detectedKeys.map((k) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => copyVariableTag(k)}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-secondary hover:bg-primary/10 hover:text-primary transition-colors border border-border cursor-pointer"
                            title="Clic para copiar {{tag}}"
                          >
                            {copiedKey === k ? (
                              <CheckIcon className="size-3 text-emerald-500" />
                            ) : (
                              <CopyIcon className="size-3 opacity-50" />
                            )}
                            <span>{"{{" + k + "}}"}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Code Textarea */}
                  <div className="flex-1 flex flex-col gap-1.5 min-h-[300px]">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="editor-html" className="text-xs font-medium">
                        Plantilla HTML + CSS
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {htmlTemplate.length} caracteres
                      </span>
                    </div>
                    <Textarea
                      id="editor-html"
                      value={htmlTemplate}
                      onChange={(e) => setHtmlTemplate(e.target.value)}
                      placeholder="<div class='placa' style='width: 1080px; height: 1350px;'>...</div>"
                      className="flex-1 text-xs leading-relaxed min-h-[340px] resize-y bg-muted/20 border-border p-3"
                      spellCheck={false}
                    />
                  </div>
                </div>
              )}

              {/* ── TAB 2: VARIABLES / INPUTS ── */}
              {activeTab === "inputs" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted/40 border border-border">
                    <div>
                      <p className="text-xs font-semibold">Configuración de campos del formulario</p>
                      <p className="text-[11px] text-muted-foreground">
                        Definí cómo interactúa el usuario con cada variable en el generador.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleScanVariables}
                        className="text-xs h-7 gap-1"
                        title="Reescanear variables desde el HTML"
                      >
                        <SearchIcon className="size-3" />
                        Sincronizar
                      </Button>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={addVariable}
                        className="text-xs h-7 gap-1"
                      >
                        <PlusIcon className="size-3" />
                        Agregar variable
                      </Button>
                    </div>
                  </div>

                  {variables.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                      <p className="text-xs font-medium">No hay variables configuradas aún.</p>
                      <p className="text-[11px] mt-1">
                        Hacé click en «Sincronizar» para detectar las variables de tu HTML automáticamente.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {variables.map((v, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-lg border border-border bg-card/60 hover:bg-card transition-colors space-y-3"
                        >
                          {/* Row 1: Key, Label, Type, Delete */}
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                            <div className="sm:col-span-3 space-y-1">
                              <Label className="text-xs font-medium text-muted-foreground">
                                Variable {"{{"}clave{"}}"}
                              </Label>
                              <Input
                                value={v.key}
                                onChange={(e) => updateVariable(i, { key: e.target.value })}
                                placeholder="etiqueta"
                                className="text-xs h-8"
                              />
                            </div>

                            <div className="sm:col-span-4 space-y-1">
                              <Label className="text-xs font-medium text-muted-foreground">
                                Etiqueta visible
                              </Label>
                              <Input
                                value={v.label}
                                onChange={(e) => updateVariable(i, { label: e.target.value })}
                                placeholder="Título superior"
                                className="text-xs h-8"
                              />
                            </div>

                            <div className="sm:col-span-4 space-y-1">
                              <Label className="text-xs font-medium text-muted-foreground">
                                Tipo de control
                              </Label>
                              <Select
                                value={v.tipo}
                                onValueChange={(val: any) => updateVariable(i, { tipo: val })}
                              >
                                <SelectTrigger className="text-xs h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(TIPO_LABELS).map(([tipoKey, tipoLbl]) => (
                                    <SelectItem key={tipoKey} value={tipoKey}>
                                      {tipoLbl}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="sm:col-span-1 flex justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeVariable(i)}
                                className="size-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title="Eliminar variable"
                              >
                                <Trash2Icon className="size-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Row 2: Instrucción / Ayuda */}
                          <div className="pt-2 border-t border-border/50 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                            <div className="sm:col-span-3 text-xs text-muted-foreground font-medium flex items-center gap-1">
                              <InfoIcon className="size-3 text-primary/70 shrink-0" />
                              <span>Instrucción / Ayuda:</span>
                            </div>
                            <div className="sm:col-span-9">
                              <Input
                                value={v.instruccion || ""}
                                onChange={(e) => updateVariable(i, { instruccion: e.target.value })}
                                placeholder="Ej: Formato '17:30 | Apertura del templo'..."
                                className="text-xs h-7.5"
                              />
                            </div>
                          </div>

                          {/* Row 3: Default value / Live preview input */}
                          <div className="pt-2 border-t border-border/50 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                            <div className="sm:col-span-3 text-xs text-muted-foreground font-medium">
                              Valor de muestra:
                            </div>

                            <div className="sm:col-span-9">
                              {v.tipo === "color" ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={v.default_val || "#16244A"}
                                    onChange={(e) => updateVariable(i, { default_val: e.target.value })}
                                    className="size-7 rounded border border-border cursor-pointer p-0.5"
                                  />
                                  <Input
                                    value={v.default_val || ""}
                                    onChange={(e) => updateVariable(i, { default_val: e.target.value })}
                                    placeholder="#16244A"
                                    className="text-xs h-7 max-w-[140px]"
                                  />
                                  <span className="text-[10px] text-muted-foreground">
                                    Se previsualiza en vivo a la derecha
                                  </span>
                                </div>
                              ) : v.tipo === "select" ? (
                                <div className="space-y-1.5">
                                  <Input
                                    value={v.default_val || ""}
                                    onChange={(e) => updateVariable(i, { default_val: e.target.value })}
                                    placeholder="Valor seleccionado por defecto"
                                    className="text-xs h-7"
                                  />
                                  <Input
                                    value={(v.opciones || []).join(", ")}
                                    onChange={(e) =>
                                      updateVariable(i, {
                                        opciones: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                                      })
                                    }
                                    placeholder="Opciones separadas por coma: Opción 1, Opción 2, Opción 3"
                                    className="text-[11px] h-6 bg-muted/30"
                                  />
                                </div>
                              ) : v.tipo === "textarea" ? (
                                <Textarea
                                  value={v.default_val || ""}
                                  onChange={(e) => updateVariable(i, { default_val: e.target.value })}
                                  placeholder="Texto largo de muestra..."
                                  className="text-xs min-h-[50px] p-2"
                                  rows={2}
                                />
                              ) : (
                                <Input
                                  value={v.default_val || ""}
                                  onChange={(e) => updateVariable(i, { default_val: e.target.value })}
                                  placeholder={v.tipo === "image" ? "URL de imagen por defecto" : "Texto de muestra..."}
                                  className="text-xs h-7"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB 3: AJUSTES ── */}
              {activeTab === "ajustes" && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="tpl-name" className="text-xs font-medium">
                      Nombre de la plantilla *
                    </Label>
                    <Input
                      id="tpl-name"
                      placeholder="Ej: Aviso parroquial / Cambio de horario"
                      value={nombre}
                      onChange={(e) => handleNombreChange(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="tpl-slug" className="text-xs font-medium">
                        Slug (identificador URL) *
                      </Label>
                      <Input
                        id="tpl-slug"
                        placeholder="aviso-parroquial"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Categoría</Label>
                      <Select value={categoria} onValueChange={setCategoria}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIAS.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Dimensions & Presets */}
                  <div className="space-y-2.5 pt-2">
                    <Label className="text-xs font-medium">Dimensiones base</Label>

                    {/* Quick Presets */}
                    <div className="grid grid-cols-3 gap-2">
                      {PRESETS.map((p) => {
                        const isSelected = anchoBase === p.w && altoBase === p.h
                        return (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => {
                              setAnchoBase(p.w)
                              setAltoBase(p.h)
                            }}
                            className={cn(
                              "p-2.5 rounded-lg border text-left transition-all cursor-pointer",
                              isSelected
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "border-border hover:bg-muted/50"
                            )}
                          >
                            <span className="text-xs font-semibold block">{p.label}</span>
                            <span className="text-[11px] text-muted-foreground block">
                              {p.w} × {p.h} px
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Custom Width / Height Inputs */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <Label htmlFor="tpl-ancho" className="text-[11px] text-muted-foreground">
                          Ancho (px)
                        </Label>
                        <Input
                          id="tpl-ancho"
                          type="number"
                          value={anchoBase}
                          onChange={(e) => setAnchoBase(Number(e.target.value))}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="tpl-alto" className="text-[11px] text-muted-foreground">
                          Alto (px)
                        </Label>
                        <Input
                          id="tpl-alto"
                          type="number"
                          value={altoBase}
                          onChange={(e) => setAltoBase(Number(e.target.value))}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <Label htmlFor="tpl-desc" className="text-xs font-medium">
                      Descripción (opcional)
                    </Label>
                    <Textarea
                      id="tpl-desc"
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      placeholder="Para qué tipo de publicaciones o avisos se recomienda esta plantilla..."
                      className="text-xs min-h-[60px]"
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Left bottom status bar (Exact h-9 height to match right preview toolbar) */}
            <div className="h-9 px-4 border-t border-border bg-card flex items-center justify-between text-xs text-muted-foreground shrink-0">
              <span>{activeTab === "html" ? "Editor HTML y CSS" : activeTab === "inputs" ? "Configuración de variables" : "Ajustes de plantilla"}</span>
              <span>{variables.length} variables configuradas</span>
            </div>
          </div>

          {/* ── Right Column: Live Real-Time Preview (Sensilo style) ── */}
          <div className="flex flex-col h-full min-h-0 bg-muted/20 overflow-hidden">
            {/* Preview Toolbar (Exact h-12 height to match left tab bar) */}
            <div className="h-12 px-4 border-b border-border bg-card flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-2">
                <EyeIcon className="size-3.5 text-muted-foreground" />
                <span className="font-medium text-foreground">Vista previa</span>
                <span className="text-xs text-muted-foreground">
                  ({anchoBase} × {altoBase} px)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  En vivo
                </span>

                <div className="h-3 w-px bg-border mx-1" />

                <Select value={zoomMode} onValueChange={(val: any) => setZoomMode(val)}>
                  <SelectTrigger className="h-7 text-xs w-24 px-2 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automático</SelectItem>
                    <SelectItem value="0.25">25%</SelectItem>
                    <SelectItem value="0.35">35%</SelectItem>
                    <SelectItem value="0.5">50%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview Viewport Canvas */}
            <div
              ref={previewContainerRef}
              className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center items-center bg-slate-200/50 dark:bg-slate-950/60 relative"
            >
              {htmlTemplate.trim() ? (
                <div
                  className="rounded-lg border border-slate-300 dark:border-slate-800 overflow-hidden shrink-0 transition-transform origin-center relative bg-white"
                  style={{
                    width: `${anchoBase * currentScale}px`,
                    height: `${altoBase * currentScale}px`,
                  }}
                >
                  <iframe
                    srcDoc={buildFullHtmlDocument(htmlTemplate, previewValues, anchoBase, altoBase)}
                    title="Vista previa en vivo"
                    className="border-0 pointer-events-none absolute top-0 left-0"
                    style={{
                      width: `${anchoBase}px`,
                      height: `${altoBase}px`,
                      transform: `scale(${currentScale})`,
                      transformOrigin: "top left",
                    }}
                    sandbox="allow-same-origin"
                  />
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <p className="text-xs">Sin contenido HTML para previsualizar</p>
                </div>
              )}
            </div>

            {/* Bottom status bar (Exact h-9 height to match left column status bar) */}
            <div className="h-9 px-4 border-t border-border bg-card flex items-center justify-between text-xs text-muted-foreground shrink-0">
              <span>Escala: {Math.round(currentScale * 100)}%</span>
              <span>{detectedKeys.length} etiquetas · {variables.length} campos</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
