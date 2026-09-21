import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  PlusIcon,
  DownloadIcon,
  Trash2Icon,
  Edit3Icon,
  EllipsisVerticalIcon,
  CopyIcon,
  EyeIcon,
  ImageIcon,
  InfoIcon,
  ChevronDownIcon,
  SlidersHorizontalIcon,
  RotateCcwIcon,
} from "lucide-react"
import {
  fetchContenidoPlantillasFromDb,
  addContenidoPlantilla,
  updateContenidoPlantilla,
  deleteContenidoPlantilla,
  type ContenidoPlantillaItem,
} from "@/lib/data-store"
import {
  renderTemplate,
  buildFullHtmlDocument,
  getDefaultValues,
  renderToPng,
  downloadBlob,
  slugify,
  PALETAS,
  type VariableDefinicion,
} from "@/lib/html-template-engine"
import { TemplateEditorDialog } from "@/components/views/contenido/template-editor-dialog"

// ─── Types ────────────────────────────────────────────

interface PlacaState {
  localId: string
  plantillaId: string
  values: Record<string, string>
}

// ─── Isolated HTML Preview Component ─────────────────

function HtmlCardPreview({
  htmlTemplate,
  values,
  width = 1080,
  height = 1350,
}: {
  htmlTemplate: string
  values: Record<string, string>
  width?: number
  height?: number
}) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [scale, setScale] = React.useState(0.25)

  React.useEffect(() => {
    if (!containerRef.current) return
    const updateScale = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        if (rect.width > 0) {
          setScale(rect.width / width)
        }
      }
    }
    updateScale()
    const obs = new ResizeObserver(updateScale)
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [width])

  const fullHtml = React.useMemo(() => {
    return buildFullHtmlDocument(htmlTemplate, values, width, height)
  }, [htmlTemplate, values, width, height])

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-md border bg-muted/20"
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <iframe
        srcDoc={fullHtml}
        title="Vista previa de placa"
        className="border-0 pointer-events-none absolute top-0 left-0"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
        sandbox="allow-same-origin"
      />
    </div>
  )
}

// ─── Placa Card (Generator) ───────────────────────────

function PlacaCard({
  placa,
  plantillas,
  onUpdate,
  onRemove,
  collapseAll,
}: {
  placa: PlacaState
  plantillas: ContenidoPlantillaItem[]
  onUpdate: (updates: Partial<PlacaState>) => void
  onRemove: () => void
  collapseAll?: boolean
}) {
  const plantilla = plantillas.find((p) => p.id === placa.plantillaId)
  const [downloading, setDownloading] = React.useState(false)
  const [showOptions, setShowOptions] = React.useState(false)

  React.useEffect(() => {
    if (collapseAll !== undefined) {
      setShowOptions(!collapseAll)
    }
  }, [collapseAll])

  if (!plantilla) return null

  const handleValueChange = (key: string, value: string) => {
    onUpdate({ values: { ...placa.values, [key]: value } })
  }

  const handleApplyPalette = (paletteKey: string) => {
    const pal = PALETAS[paletteKey]
    if (!pal) return
    onUpdate({
      values: {
        ...placa.values,
        paleta: paletteKey,
        color_fondo: pal.fondo,
        color_titulo: pal.titulo,
        color_texto: pal.texto,
        color_acento: pal.acento,
      },
    })
  }

  const handleImageUpload = (key: string, file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      handleValueChange(key, reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDownloadPng = async () => {
    setDownloading(true)
    try {
      const blob = await renderToPng(
        plantilla.html_template,
        placa.values,
        plantilla.ancho_base || 1080,
        plantilla.alto_base || 1350
      )
      downloadBlob(blob, `${slugify(placa.values.titulo || plantilla.nombre)}.png`)
    } catch (err) {
      console.error("Error al generar PNG:", err)
      alert("No se pudo generar la imagen.")
    } finally {
      setDownloading(false)
    }
  }

  const renderControl = (v: VariableDefinicion) => {
    const value = placa.values[v.key] ?? v.default_val ?? ""

    switch (v.tipo) {
      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => handleValueChange(v.key, e.target.value)}
            placeholder={v.placeholder || v.label}
            className="text-xs min-h-14"
          />
        )
      case "select":
        return (
          <Select value={value} onValueChange={(val) => handleValueChange(v.key, val)}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder={v.label} />
            </SelectTrigger>
            <SelectContent>
              {(v.opciones || []).map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case "color":
        return (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={value || "#000000"}
              onChange={(e) => handleValueChange(v.key, e.target.value)}
              className="size-8 rounded border cursor-pointer p-0.5"
            />
            <Input
              value={value}
              onChange={(e) => handleValueChange(v.key, e.target.value)}
              className="text-xs h-8 flex-1"
              placeholder="#000000"
            />
          </div>
        )
      case "image":
        return (
          <div className="flex flex-col gap-1.5">
            {value && (
              <img
                src={value}
                alt=""
                className="w-full h-20 object-cover rounded border"
              />
            )}
            <div className="flex gap-1.5">
              <Input
                value={value}
                onChange={(e) => handleValueChange(v.key, e.target.value)}
                className="text-xs h-8 flex-1"
                placeholder="URL de imagen o subir archivo"
              />
              <label className="inline-flex items-center justify-center h-8 px-2 rounded-md border bg-background cursor-pointer hover:bg-muted text-xs">
                <ImageIcon className="size-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleImageUpload(v.key, f)
                  }}
                />
              </label>
            </div>
          </div>
        )
      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleValueChange(v.key, e.target.value)}
            className="text-xs h-8"
          />
        )
      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleValueChange(v.key, e.target.value)}
            placeholder={v.placeholder || v.label}
            className="text-xs h-8"
          />
        )
    }
  }

  return (
    <Card className="overflow-hidden border border-border">
      <CardContent className="p-3 flex flex-col gap-2.5">
        {/* Isolated HTML Preview (100% data-driven from DB) */}
        <HtmlCardPreview
          htmlTemplate={plantilla.html_template}
          values={placa.values}
          width={plantilla.ancho_base || 1080}
          height={plantilla.alto_base || 1350}
        />

        {/* Compact Action Bar right under preview */}
        <div className="flex items-center justify-between gap-1.5 pt-0.5">
          <div className="flex items-center gap-1.5 flex-1">
            <Button
              variant="default"
              size="sm"
              className="h-8 flex-1 text-xs gap-1.5 font-medium"
              onClick={handleDownloadPng}
              disabled={downloading}
            >
              <DownloadIcon className="size-3.5" />
              {downloading ? "Generando…" : "Descargar PNG"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="size-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={onRemove}
              title="Eliminar placa"
            >
              <Trash2Icon className="size-3.5" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground border border-border/50"
            onClick={() => setShowOptions(!showOptions)}
            title={showOptions ? "Ocultar opciones de edición" : "Mostrar opciones de edición"}
          >
            <SlidersHorizontalIcon className="size-3" />
            <span>{showOptions ? "Ocultar" : "Opciones"}</span>
            <ChevronDownIcon
              className={cn(
                "size-3.5 transition-transform duration-200",
                showOptions && "rotate-180"
              )}
            />
          </Button>
        </div>

        {/* Collapsible Options Panel */}
        {showOptions && (
          <div className="flex flex-col gap-2.5 pt-2 border-t border-border/60">
            {/* Template & Palette selectors */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Plantilla
                </span>
                <Select
                  value={placa.plantillaId}
                  onValueChange={(val) => {
                    const newPlantilla = plantillas.find((p) => p.id === val)
                    if (newPlantilla) {
                      onUpdate({
                        plantillaId: val,
                        values: getDefaultValues(newPlantilla.variables),
                      })
                    }
                  }}
                >
                  <SelectTrigger className="text-xs truncate">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {plantillas.filter((p) => p.activo).map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Estilo / Paleta
                </span>
                <Select onValueChange={handleApplyPalette}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Paleta..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PALETAS).map(([pk, pv]) => (
                      <SelectItem key={pk} value={pk}>
                        <div className="flex items-center gap-1.5">
                          <span className="size-2.5 rounded-full inline-block" style={{ backgroundColor: pv.fondo, border: "1px solid " + pv.acento }} />
                          <span>{pv.nombre}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dynamic fields with optional instruction tooltip */}
            {plantilla.variables
              .filter((v) => v.tipo !== "color")
              .map((v) => (
                <div key={v.key} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {v.label}
                    </span>
                    {(v.instruccion || v.ayuda) && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/60 hover:bg-muted/90 px-1.5 py-0.5 rounded cursor-help border border-border/40 max-w-[180px]"
                        title={v.instruccion || v.ayuda}
                      >
                        <InfoIcon className="size-3 text-primary/70 shrink-0" />
                        <span className="truncate">{v.instruccion || v.ayuda}</span>
                      </span>
                    )}
                  </div>
                  {renderControl(v)}
                </div>
              ))}

            {/* Color fields in a row */}
            {plantilla.variables.some((v) => v.tipo === "color") && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Colores
                </span>
                <div className="flex flex-wrap gap-2">
                  {plantilla.variables
                    .filter((v) => v.tipo === "color")
                    .map((v) => (
                      <div key={v.key} className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={placa.values[v.key] || v.default_val || "#000000"}
                          onChange={(e) => handleValueChange(v.key, e.target.value)}
                          className="size-7 rounded border cursor-pointer p-0.5"
                          title={v.label}
                        />
                        <span className="text-[10px] text-muted-foreground">{v.label}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main View ────────────────────────────────────────

export function ContenidoView() {
  const [plantillas, setPlantillas] = React.useState<ContenidoPlantillaItem[]>([])
  const [placas, setPlacas] = React.useState<PlacaState[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isEditorOpen, setIsEditorOpen] = React.useState(false)
  const [editingPlantilla, setEditingPlantilla] = React.useState<ContenidoPlantillaItem | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [collapseAll, setCollapseAll] = React.useState(true)

  const populateAllPlacas = React.useCallback((items: ContenidoPlantillaItem[]) => {
    const activeItems = items.filter((p) => p.activo !== false)
    return activeItems.map((p, idx) => ({
      localId: `placa-${p.id}-${idx}`,
      plantillaId: p.id,
      values: getDefaultValues(p.variables),
    }))
  }, [])

  const refresh = React.useCallback(async () => {
    setLoading(true)
    try {
      const items = await fetchContenidoPlantillasFromDb()
      setPlantillas(items)
      setPlacas((prev) => {
        if (prev.length > 0) return prev
        return populateAllPlacas(items)
      })
    } finally {
      setLoading(false)
    }
  }, [populateAllPlacas])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  const resetToAllPlacas = () => {
    if (confirm("¿Restablecer las 20 placas a sus valores iniciales?")) {
      setPlacas(populateAllPlacas(plantillas))
    }
  }

  // ── Generator tab ──

  const addPlaca = () => {
    const first = plantillas.find((p) => p.activo)
    if (!first) return
    setPlacas((prev) => [
      ...prev,
      {
        localId: `placa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        plantillaId: first.id,
        values: getDefaultValues(first.variables),
      },
    ])
  }

  const updatePlaca = (localId: string, updates: Partial<PlacaState>) => {
    setPlacas((prev) =>
      prev.map((p) => (p.localId === localId ? { ...p, ...updates } : p))
    )
  }

  const removePlaca = (localId: string) => {
    setPlacas((prev) => prev.filter((p) => p.localId !== localId))
  }

  // ── Config tab ──

  const handleSavePlantilla = async (item: Omit<ContenidoPlantillaItem, "id">) => {
    if (editingPlantilla) {
      await updateContenidoPlantilla(editingPlantilla.id, item)
    } else {
      await addContenidoPlantilla(item)
    }
    await refresh()
  }

  const handleDeletePlantilla = async (id: string) => {
    if (!confirm("¿Eliminar este tipo de contenido?")) return
    await deleteContenidoPlantilla(id)
    await refresh()
  }

  const handleDuplicate = (item: ContenidoPlantillaItem) => {
    setEditingPlantilla(null)
    setIsEditorOpen(true)
    // Wait for dialog to open, then fill with cloned data
    setTimeout(() => {
      setEditingPlantilla({
        ...item,
        id: "",
        slug: item.slug + "-copia",
        nombre: item.nombre + " (copia)",
      } as any)
    }, 50)
  }

  const filteredPlantillas = plantillas.filter(
    (p) =>
      p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <Tabs defaultValue="generador">
        <TabsList>
          <TabsTrigger value="generador">Generador</TabsTrigger>
          <TabsTrigger value="tipos">Tipos de contenido</TabsTrigger>
        </TabsList>

        {/* ── Tab: Generador ──────────────────────── */}
        <TabsContent value="generador" className="mt-4">
          {loading ? (
            <div className="flex flex-col gap-4">
              {/* Skeleton Control Bar */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                <Skeleton className="h-4 w-48" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-36 rounded-md" />
                  <Skeleton className="h-8 w-28 rounded-md" />
                </div>
              </div>

              {/* Skeleton Grid */}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 items-start">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden border border-border">
                    <CardContent className="p-3 flex flex-col gap-2.5">
                      <Skeleton className="w-full aspect-[4/5] rounded-md" />
                      <div className="flex items-center justify-between gap-1.5 pt-0.5">
                        <Skeleton className="h-8 flex-1 rounded-md" />
                        <Skeleton className="size-8 rounded-md" />
                        <Skeleton className="h-8 w-20 rounded-md" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : plantillas.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-sm">No hay tipos de contenido configurados.</p>
              <p className="text-xs mt-1">
                Creá uno en la pestaña «Tipos de contenido» para empezar a generar placas.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Generator Top Control Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-3 rounded-lg border border-border">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-foreground">{placas.length} {placas.length === 1 ? "placa lista" : "placas listas"}</span>
                  <span className="text-muted-foreground">• Editá los textos, cambiá colores y descargá el PNG</span>
                </div>
                <div className="flex items-center flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => setCollapseAll((prev) => !prev)}
                  >
                    <SlidersHorizontalIcon className="size-3.5" />
                    <span>{collapseAll ? "Mostrar todas las opciones" : "Ocultar todas las opciones"}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                    onClick={resetToAllPlacas}
                    title="Restablecer todas las 20 plantillas"
                  >
                    <RotateCcwIcon className="size-3.5" />
                    <span>Restablecer las {plantillas.length}</span>
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={addPlaca}
                  >
                    <PlusIcon className="size-3.5" />
                    <span>Agregar placa</span>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 items-start">
                {placas.map((placa) => (
                  <PlacaCard
                    key={placa.localId}
                    placa={placa}
                    plantillas={plantillas}
                    onUpdate={(updates) => updatePlaca(placa.localId, updates)}
                    onRemove={() => removePlaca(placa.localId)}
                    collapseAll={collapseAll}
                  />
                ))}

                {/* Add button */}
                <button
                  type="button"
                  onClick={addPlaca}
                  className="flex flex-col items-center justify-center gap-2 min-h-[380px] rounded-xl border-2 border-dashed border-muted-foreground/25 text-muted-foreground hover:border-primary/40 hover:text-primary/70 transition-colors cursor-pointer"
                >
                  <PlusIcon className="size-8 stroke-1" />
                  <span className="text-sm font-medium">Agregar placa</span>
                </button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Tab: Tipos de contenido ─────────────── */}
        <TabsContent value="tipos" className="mt-4">
          <div className="flex flex-col gap-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Input
                  placeholder="Buscar tipos…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                </span>
              </div>
              <Button
                onClick={() => {
                  setEditingPlantilla(null)
                  setIsEditorOpen(true)
                }}
                size="sm"
                className="gap-1.5"
              >
                <PlusIcon className="size-4" />
                Crear tipo
              </Button>
            </div>

            {/* Table */}
            {loading ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                      <TableHead className="hidden md:table-cell">Dimensiones</TableHead>
                      <TableHead className="hidden md:table-cell">Variables</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-44" />
                            <Skeleton className="h-3 w-64" />
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Skeleton className="h-5 w-20 rounded-full" />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Skeleton className="h-4 w-14" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="size-8 rounded-md" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : filteredPlantillas.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-sm">No hay tipos de contenido.</p>
                <p className="text-xs mt-1">Creá uno para empezar a generar placas y piezas visuales.</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                      <TableHead className="hidden md:table-cell">Dimensiones</TableHead>
                      <TableHead className="hidden md:table-cell">Variables</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPlantillas.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{item.nombre}</span>
                            {item.descripcion && (
                              <span className="text-xs text-muted-foreground line-clamp-1">
                                {item.descripcion}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="text-xs capitalize">
                            {item.categoria}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {item.ancho_base}×{item.alto_base}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {(item.variables || []).length} campos
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={<Button variant="ghost" size="sm" className="size-8 p-0" />}
                            >
                              <EllipsisVerticalIcon className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingPlantilla(item)
                                  setIsEditorOpen(true)
                                }}
                              >
                                <Edit3Icon className="size-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicate(item)}>
                                <CopyIcon className="size-4 mr-2" />
                                Duplicar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeletePlantilla(item.id)}
                              >
                                <Trash2Icon className="size-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Editor Dialog */}
      <TemplateEditorDialog
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        editingItem={editingPlantilla}
        onSave={handleSavePlantilla}
      />
    </div>
  )
}
