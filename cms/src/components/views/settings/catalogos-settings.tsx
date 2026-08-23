"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  Edit3Icon,
  EllipsisVerticalIcon,
  RotateCcwIcon,
} from "lucide-react"
import {
  getCatalog,
  addCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  resetCatalog,
  type CatalogName,
  type CatalogOption,
} from "@/lib/catalog"

const CATALOG_ITEMS: { id: CatalogName; label: string; titulo: string; descripcion: string; hint: string }[] = [
  {
    id: "tipos_horario",
    label: "Tipos de celebración",
    titulo: "Tipos de celebración",
    descripcion: "Opciones disponibles en el selector de tipo al crear o editar horarios.",
    hint: "Alimenta el selector 'Tipo' en horarios y misas",
  },
  {
    id: "categorias_galeria",
    label: "Categorías de galería",
    titulo: "Categorías de galería",
    descripcion: "Opciones disponibles en el selector de categoría al subir fotos.",
    hint: "Alimenta el selector 'Categoría' en la galería de fotos",
  },
  {
    id: "lugares",
    label: "Lugares del templo",
    titulo: "Lugares del templo",
    descripcion: "Espacios físicos y capillas disponibles al agendar actividades.",
    hint: "Alimenta el selector 'Lugar' en horarios y actividades",
  },
  {
    id: "motivos_contacto",
    label: "Motivos de contacto",
    titulo: "Motivos de contacto",
    descripcion: "Categorías de trámites y consultas para los mensajes recibidos.",
    hint: "Alimenta el campo 'Motivo' en consultas y mensajes",
  },
]

export function CatalogosSettings() {
  const [activeCatalog, setActiveCatalog] = React.useState<CatalogName>("tipos_horario")
  const [items, setItems] = React.useState<CatalogOption[]>([])
  const [searchTerm, setSearchTerm] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<CatalogOption | null>(null)

  // Form fields
  const [nombre, setNombre] = React.useState("")
  const [codigo, setCodigo] = React.useState("")
  const [descripcion, setDescripcion] = React.useState("")
  const [activo, setActivo] = React.useState(true)

  const fetchCatalogData = React.useCallback((catalogName: CatalogName) => {
    setLoading(true)
    const data = getCatalog(catalogName)
    setItems(data)
    setLoading(false)
  }, [])

  React.useEffect(() => {
    setSearchTerm("")
    fetchCatalogData(activeCatalog)
  }, [activeCatalog, fetchCatalogData])

  const filtered = React.useMemo(() => {
    if (!searchTerm.trim()) return items
    const lower = searchTerm.toLowerCase()
    return items.filter(
      (item) =>
        item.nombre.toLowerCase().includes(lower) ||
        item.codigo.toLowerCase().includes(lower) ||
        (item.descripcion && item.descripcion.toLowerCase().includes(lower))
    )
  }, [items, searchTerm])

  const handleOpenAdd = () => {
    setEditingItem(null)
    setNombre("")
    setCodigo("")
    setDescripcion("")
    setActivo(true)
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (item: CatalogOption) => {
    setEditingItem(item)
    setNombre(item.nombre)
    setCodigo(item.codigo)
    setDescripcion(item.descripcion || "")
    setActivo(item.activo)
    setIsDialogOpen(true)
  }

  const handleNombreChange = (val: string) => {
    setNombre(val)
    if (!editingItem) {
      const slug = val
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
      setCodigo(slug)
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return

    const payload = {
      nombre: nombre.trim(),
      codigo: codigo.trim() || nombre.toLowerCase().trim(),
      descripcion: descripcion.trim(),
      activo,
    }

    if (editingItem) {
      updateCatalogItem(activeCatalog, editingItem.id, payload)
    } else {
      addCatalogItem(activeCatalog, payload)
    }

    fetchCatalogData(activeCatalog)
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    deleteCatalogItem(activeCatalog, id)
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleToggleActivo = (item: CatalogOption) => {
    const nextState = !item.activo
    updateCatalogItem(activeCatalog, item.id, { activo: nextState })
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, activo: nextState } : i)))
  }

  const handleReset = () => {
    if (confirm(`¿Restablecer "${currentMeta?.titulo.toLowerCase()}" a sus valores por defecto?`)) {
      resetCatalog(activeCatalog)
      fetchCatalogData(activeCatalog)
    }
  }

  const currentMeta = CATALOG_ITEMS.find((d) => d.id === activeCatalog)

  return (
    <div className="flex flex-col md:flex-row min-h-full h-full items-stretch">
      {/* ─── Left Sidebar ─── */}
      <aside className="w-full md:w-56 lg:w-64 shrink-0 border-r bg-muted/10 p-4 lg:p-6 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="border-b pb-4">
            <h2 className="text-base font-semibold text-foreground">Catálogos</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Tablas de referencia</p>
          </div>

          <nav className="space-y-1">
            {CATALOG_ITEMS.map((cat) => {
              const isSelected = activeCatalog === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCatalog(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  {cat.label}
                </button>
              )
            })}
          </nav>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="w-full text-xs h-8 gap-1.5 text-muted-foreground hover:text-foreground justify-start px-2 cursor-pointer mt-6"
        >
          <RotateCcwIcon className="size-3" />
          <span>Restablecer</span>
        </Button>
      </aside>

      {/* ─── Right Content Panel ─── */}
      <main className="flex-1 w-full min-w-0 p-4 lg:p-6 space-y-4 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 min-h-[57px]">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {currentMeta?.titulo}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {currentMeta?.descripcion}
            </p>
          </div>

          <Button onClick={handleOpenAdd} size="sm" className="gap-1.5 cursor-pointer shrink-0">
            <PlusIcon className="size-4" />
            Nueva opción
          </Button>
        </div>

        {/* Toolbar */}
        <div className="relative w-full sm:w-72">
          <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o código..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Table Card (Identical pattern to HorariosView, AvisosView) */}
        <Card className="p-0">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Cargando catálogo...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No se encontraron opciones en este catálogo.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="px-4">Nombre</TableHead>
                    <TableHead className="px-4">Código</TableHead>
                    <TableHead className="px-4 hidden md:table-cell">Descripción</TableHead>
                    <TableHead className="px-4">Estado</TableHead>
                    <TableHead className="text-right px-4"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer"
                      onClick={() => handleOpenEdit(item)}
                    >
                      <TableCell className="px-4 py-3 font-medium text-sm">
                        {item.nombre}
                      </TableCell>
                      <TableCell className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {item.codigo}
                      </TableCell>
                      <TableCell className="px-4 py-3 hidden md:table-cell text-sm text-muted-foreground max-w-xs truncate">
                        {item.descripcion || "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {item.activo ? (
                          <Badge variant="outline" className="gap-1.5 text-emerald-600 border-emerald-300">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1.5 text-muted-foreground">
                            <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                            Inactivo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground data-open:bg-muted cursor-pointer"
                              />
                            }
                          >
                            <EllipsisVerticalIcon className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem className="cursor-pointer" onClick={() => handleOpenEdit(item)}>
                              <Edit3Icon />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => handleToggleActivo(item)}>
                              {item.activo ? "Desactivar" : "Activar"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              className="cursor-pointer"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2Icon />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Modal to Add / Edit catalog option */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar opción" : "Nueva opción"} — {currentMeta?.titulo.toLowerCase()}
              </DialogTitle>
              <DialogDescription>
                Esta opción aparecerá en los selectores correspondientes del sistema.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nombre (visible para el usuario)</Label>
                <Input
                  required
                  placeholder="Ej: Misa de difuntos"
                  value={nombre}
                  onChange={(e) => handleNombreChange(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>Código (clave interna)</Label>
                <Input
                  required
                  placeholder="Ej: difuntos"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>Descripción (opcional)</Label>
                <Textarea
                  rows={2}
                  placeholder="Aclaración breve sobre esta opción..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>Estado</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setActivo(true)}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-start transition-all cursor-pointer ${
                      activo
                        ? "border-emerald-500/60 bg-emerald-500/5 ring-1 ring-emerald-500/30 font-medium text-foreground"
                        : "border-border bg-card hover:bg-accent/40 text-muted-foreground"
                    }`}
                  >
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span className="text-sm">Activo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivo(false)}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-start transition-all cursor-pointer ${
                      !activo
                        ? "border-muted-foreground/50 bg-muted/40 ring-1 ring-muted-foreground/30 font-medium text-foreground"
                        : "border-border bg-card hover:bg-accent/40 text-muted-foreground"
                    }`}
                  >
                    <span className="size-2 rounded-full bg-muted-foreground/40" />
                    <span className="text-sm">Inactivo</span>
                  </button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="cursor-pointer"
              >
                Cancelar
              </Button>
              <Button type="submit" className="cursor-pointer">
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
