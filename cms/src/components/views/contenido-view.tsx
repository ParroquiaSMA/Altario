import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
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
  getDefaultValues,
  renderToPng,
  downloadBlob,
  slugify,
  type VariableDefinicion,
} from "@/lib/html-template-engine"
import { TemplateEditorDialog } from "@/components/views/contenido/template-editor-dialog"

// ─── Types ────────────────────────────────────────────

interface PlacaState {
  localId: string
  plantillaId: string
  values: Record<string, string>
}

// ─── Placa Card (Generator) ───────────────────────────

function PlacaCard({
  placa,
  plantillas,
  onUpdate,
  onRemove,
}: {
  placa: PlacaState
  plantillas: ContenidoPlantillaItem[]
  onUpdate: (updates: Partial<PlacaState>) => void
  onRemove: () => void
}) {
  const plantilla = plantillas.find((p) => p.id === placa.plantillaId)
  const previewRef = React.useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = React.useState(false)

  if (!plantilla) return null

  const renderedHtml = renderTemplate(plantilla.html_template, placa.values)

  // Scale factor for preview
  const scale = 280 / plantilla.ancho_base
  const previewHeight = plantilla.alto_base * scale

  const handleValueChange = (key: string, value: string) => {
    onUpdate({ values: { ...placa.values, [key]: value } })
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
        plantilla.ancho_base,
        plantilla.alto_base
      )
      downloadBlob(blob, `${slugify(placa.values.titulo || plantilla.nombre)}.png`)
    } catch (err) {
      console.error("Error al generar PNG:", err)
      alert("No se pudo generar la imagen. Intentá con otro navegador.")
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
            className="text-xs min-h-16"
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
              className="text-xs h-8 font-mono flex-1"
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
    <Card className="overflow-hidden">
      <CardContent className="p-3 flex flex-col gap-3">
        {/* Preview */}
        <div
          ref={previewRef}
          className="relative rounded-md overflow-hidden border bg-muted/30"
          style={{ width: "100%", height: `${previewHeight}px` }}
        >
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              width: `${plantilla.ancho_base}px`,
              height: `${plantilla.alto_base}px`,
              pointerEvents: "none",
            }}
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </div>

        {/* Template selector */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
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
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {plantillas.filter((p) => p.activo).map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dynamic fields */}
        {plantilla.variables
          .filter((v) => v.tipo !== "color")
          .map((v) => (
            <div key={v.key} className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {v.label}
              </span>
              {renderControl(v)}
            </div>
          ))}

        {/* Color fields in a row */}
        {plantilla.variables.some((v) => v.tipo === "color") && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
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

        {/* Actions */}
        <div className="flex gap-2 mt-1">
          <Button
            variant="default"
            size="sm"
            className="flex-1 text-xs gap-1.5"
            onClick={handleDownloadPng}
            disabled={downloading}
          >
            <DownloadIcon className="size-3.5" />
            {downloading ? "Generando…" : "Descargar PNG"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs text-muted-foreground hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2Icon className="size-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main View ────────────────────────────────────────

export function ContenidoView() {
  const [plantillas, setPlantillas] = React.useState<ContenidoPlantillaItem[]>([])
  const [placas, setPlacas] = React.useState<PlacaState[]>([])
  const [isEditorOpen, setIsEditorOpen] = React.useState(false)
  const [editingPlantilla, setEditingPlantilla] = React.useState<ContenidoPlantillaItem | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")

  const refresh = React.useCallback(async () => {
    const items = await fetchContenidoPlantillasFromDb()
    setPlantillas(items)
  }, [])

  React.useEffect(() => {
    refresh()
  }, [refresh])

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
          {plantillas.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-sm">No hay tipos de contenido configurados.</p>
              <p className="text-xs mt-1">
                Creá uno en la pestaña «Tipos de contenido» para empezar a generar placas.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 items-start">
                {placas.map((placa) => (
                  <PlacaCard
                    key={placa.localId}
                    placa={placa}
                    plantillas={plantillas}
                    onUpdate={(updates) => updatePlaca(placa.localId, updates)}
                    onRemove={() => removePlaca(placa.localId)}
                  />
                ))}

                {/* Add button */}
                <button
                  type="button"
                  onClick={addPlaca}
                  className="flex flex-col items-center justify-center gap-2 min-h-[420px] rounded-xl border-2 border-dashed border-muted-foreground/25 text-muted-foreground hover:border-primary/40 hover:text-primary/70 transition-colors cursor-pointer"
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
            {filteredPlantillas.length === 0 ? (
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
