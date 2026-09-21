import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  GripVerticalIcon,
} from "lucide-react"
import { extractVariables, type VariableDefinicion } from "@/lib/html-template-engine"
import type { ContenidoPlantillaItem } from "@/lib/data-store"

const TIPO_LABELS: Record<string, string> = {
  text: "Texto",
  textarea: "Texto largo",
  select: "Selector",
  color: "Color",
  image: "Imagen",
  date: "Fecha",
  number: "Número",
}

const CATEGORIAS = [
  { value: "redes", label: "Redes sociales" },
  { value: "impresos", label: "Impresos" },
  { value: "web", label: "Web" },
  { value: "personalizado", label: "Personalizado" },
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
  const [nombre, setNombre] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [descripcion, setDescripcion] = React.useState("")
  const [categoria, setCategoria] = React.useState("redes")
  const [anchoBase, setAnchoBase] = React.useState(1080)
  const [altoBase, setAltoBase] = React.useState(1350)
  const [htmlTemplate, setHtmlTemplate] = React.useState("")
  const [variables, setVariables] = React.useState<VariableDefinicion[]>([])
  const [saving, setSaving] = React.useState(false)

  // Sync state when editingItem changes
  React.useEffect(() => {
    if (editingItem) {
      setNombre(editingItem.nombre)
      setSlug(editingItem.slug)
      setDescripcion(editingItem.descripcion || "")
      setCategoria(editingItem.categoria)
      setAnchoBase(editingItem.ancho_base)
      setAltoBase(editingItem.alto_base)
      setHtmlTemplate(editingItem.html_template)
      setVariables(editingItem.variables || [])
    } else {
      setNombre("")
      setSlug("")
      setDescripcion("")
      setCategoria("redes")
      setAnchoBase(1080)
      setAltoBase(1350)
      setHtmlTemplate("")
      setVariables([])
    }
  }, [editingItem, open])

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
        tipo: key.includes("color") ? "color" : key.includes("foto") || key.includes("imagen") || key.includes("image") ? "image" : "text",
        default_val: "",
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
      { key: "", label: "", tipo: "text", default_val: "" },
    ])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || !slug.trim() || !htmlTemplate.trim()) return

    setSaving(true)
    try {
      await onSave({
        slug: slug.trim(),
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        categoria,
        ancho_base: anchoBase,
        alto_base: altoBase,
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? "Editar tipo de contenido" : "Crear nuevo tipo de contenido"}
          </DialogTitle>
          <DialogDescription>
            Pegá tu HTML con variables <code className="text-xs bg-muted px-1 rounded">{"{{variable}}"}</code> y asociá cada una a un tipo de control.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tpl-nombre">Nombre</Label>
              <Input
                id="tpl-nombre"
                value={nombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                placeholder="Ej: Aviso parroquial"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tpl-slug">Slug (identificador)</Label>
              <Input
                id="tpl-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="aviso-parroquial"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Categoría</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tpl-ancho">Ancho (px)</Label>
              <Input
                id="tpl-ancho"
                type="number"
                value={anchoBase}
                onChange={(e) => setAnchoBase(Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tpl-alto">Alto (px)</Label>
              <Input
                id="tpl-alto"
                type="number"
                value={altoBase}
                onChange={(e) => setAltoBase(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tpl-desc">Descripción (opcional)</Label>
            <Input
              id="tpl-desc"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Breve descripción del uso de esta plantilla"
            />
          </div>

          {/* HTML Template */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="tpl-html">Código HTML + CSS</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleScanVariables}
                className="gap-1.5 text-xs"
              >
                <SearchIcon className="size-3.5" />
                Escanear variables
              </Button>
            </div>
            <Textarea
              id="tpl-html"
              value={htmlTemplate}
              onChange={(e) => setHtmlTemplate(e.target.value)}
              placeholder={'<div style="background: {{color_fondo}}">\n  <h1>{{titulo}}</h1>\n  <p>{{descripcion}}</p>\n</div>'}
              className="font-mono text-xs min-h-40"
            />
          </div>

          {/* Variables */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Variables detectadas
                {variables.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{variables.length}</Badge>
                )}
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVariable}
                className="gap-1.5 text-xs"
              >
                <PlusIcon className="size-3.5" />
                Agregar variable
              </Button>
            </div>

            {variables.length === 0 && (
              <p className="text-xs text-muted-foreground py-3 text-center border border-dashed rounded-md">
                Escribí tu HTML con variables <code>{"{{nombre}}"}</code> y hacé clic en «Escanear variables».
              </p>
            )}

            <div className="flex flex-col gap-2">
              {variables.map((v, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-end p-3 border rounded-md bg-muted/20"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Variable
                    </span>
                    <Input
                      value={v.key}
                      onChange={(e) => updateVariable(i, { key: e.target.value })}
                      placeholder="nombre_variable"
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Etiqueta
                    </span>
                    <Input
                      value={v.label}
                      onChange={(e) => updateVariable(i, { label: e.target.value })}
                      placeholder="Nombre visible"
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Tipo
                    </span>
                    <Select
                      value={v.tipo}
                      onValueChange={(val: any) => updateVariable(i, { tipo: val })}
                    >
                      <SelectTrigger className="text-xs h-8 w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TIPO_LABELS).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVariable(i)}
                    className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>

                  {/* Extra row for default value + opciones (select type) */}
                  <div className="col-span-4 grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-end">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Valor por defecto
                      </span>
                      <Input
                        value={v.default_val || ""}
                        onChange={(e) => updateVariable(i, { default_val: e.target.value })}
                        placeholder="Valor inicial"
                        className="text-xs h-8"
                      />
                    </div>
                    {v.tipo === "select" && (
                      <div className="col-span-2 flex flex-col gap-1">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          Opciones (separadas por coma)
                        </span>
                        <Input
                          value={(v.opciones || []).join(", ")}
                          onChange={(e) =>
                            updateVariable(i, {
                              opciones: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                            })
                          }
                          placeholder="Opción 1, Opción 2, Opción 3"
                          className="text-xs h-8"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !nombre.trim() || !htmlTemplate.trim()}>
              {saving ? "Guardando…" : editingItem ? "Guardar cambios" : "Crear tipo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
