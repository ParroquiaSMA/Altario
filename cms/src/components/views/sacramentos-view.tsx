"use client"

import * as React from "react"
import {
  getSacramentos,
  fetchSacramentosFromDb,
  addSacramento,
  updateSacramento,
  deleteSacramento,
  type SacramentoItem,
} from "@/lib/data-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  PlusIcon,
  SearchIcon,
  EllipsisVerticalIcon,
  Edit3Icon,
  Trash2Icon,
} from "lucide-react"

const CATEGORIAS_SACRAMENTO = [
  { value: "sacramento", label: "Sacramento" },
  { value: "acompanamiento", label: "Acompañamiento" },
  { value: "vocacion", label: "Vocación" },
]

export function SacramentosView() {
  const [items, setItems] = React.useState<SacramentoItem[]>([])
  const [searchTerm, setSearchTerm] = React.useState("")
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<SacramentoItem | null>(null)

  // Form states
  const [titulo, setTitulo] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [categoria, setCategoria] = React.useState("sacramento")
  const [descripcion, setDescripcion] = React.useState("")
  const [requisitos, setRequisitos] = React.useState("")

  const refresh = React.useCallback(async () => {
    setItems(getSacramentos())
    const fromDb = await fetchSacramentosFromDb()
    if (fromDb && fromDb.length > 0) {
      setItems(fromDb)
    }
  }, [])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  const filtered = items.filter((s) =>
    s.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.requisitos.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleOpenNew = () => {
    setEditingItem(null)
    setTitulo("")
    setSlug("")
    setCategoria("sacramento")
    setDescripcion("")
    setRequisitos("")
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (item: SacramentoItem) => {
    setEditingItem(item)
    setTitulo(item.titulo)
    setSlug(item.slug || "")
    setCategoria(item.categoria || "sacramento")
    setDescripcion(item.descripcion)
    setRequisitos(item.requisitos)
    setIsDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titulo.trim() || !descripcion.trim()) return

    const generatedSlug = slug.trim() || titulo.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

    try {
      if (editingItem) {
        await updateSacramento(editingItem.id, {
          titulo: titulo.trim(),
          slug: generatedSlug,
          categoria,
          descripcion: descripcion.trim(),
          requisitos: requisitos.trim(),
        })
      } else {
        await addSacramento({
          titulo: titulo.trim(),
          slug: generatedSlug,
          categoria,
          descripcion: descripcion.trim(),
          requisitos: requisitos.trim(),
          orden: items.length + 1,
        })
      }

      refresh()
      setIsDialogOpen(false)
    } catch (err: any) {
      console.error("[Sacramentos] Error al guardar sacramento:", err)
      alert("Error al guardar sacramento en la base de datos: " + (err.message || err))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este sacramento?")) return
    try {
      await deleteSacramento(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch (err: any) {
      console.error("[Sacramentos] Error al eliminar sacramento:", err)
      alert("Error al eliminar sacramento de la base de datos: " + (err.message || err))
    }
  }

  const getCategoriaLabel = (cat: string) => {
    const found = CATEGORIAS_SACRAMENTO.find((c) => c.value === cat)
    return found ? found.label : cat
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 lg:px-6">
        <div className="relative w-full sm:w-80">
          <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar sacramentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={handleOpenNew} className="gap-2 w-full sm:w-auto cursor-pointer">
          <PlusIcon className="size-4" />
          Nuevo Sacramento
        </Button>
      </div>

      {/* Table Card */}
      <div className="px-4 lg:px-6">
        <Card className="p-0">
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No se encontraron sacramentos.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="px-4">Título</TableHead>
                    <TableHead className="px-4">Categoría</TableHead>
                    <TableHead className="px-4 hidden sm:table-cell">Descripción</TableHead>
                    <TableHead className="px-4 hidden md:table-cell">Requisitos</TableHead>
                    <TableHead className="text-right px-4"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow
                      key={s.id}
                      className="cursor-pointer"
                      onClick={() => handleOpenEdit(s)}
                    >
                      <TableCell className="px-4 py-3 font-medium text-sm">{s.titulo}</TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant="secondary" className="text-xs font-normal">
                          {getCategoriaLabel(s.categoria)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 hidden sm:table-cell text-sm text-muted-foreground max-w-xs truncate">
                        {s.descripcion}
                      </TableCell>
                      <TableCell className="px-4 py-3 hidden md:table-cell text-sm text-muted-foreground max-w-sm truncate">
                        {s.requisitos}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground data-open:bg-muted cursor-pointer" />
                            }
                          >
                            <EllipsisVerticalIcon className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem className="cursor-pointer" onClick={() => handleOpenEdit(s)}>
                              <Edit3Icon />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" className="cursor-pointer" onClick={() => handleDelete(s.id)}>
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
      </div>

      {/* Edit / Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar Sacramento" : "Nuevo Sacramento"}</DialogTitle>
            <DialogDescription>
              Configuración de requisitos e información para la comunidad.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Título</Label>
                <Input
                  placeholder="Ej: Bautismo"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>Categoría</Label>
                <Select
                  items={CATEGORIAS_SACRAMENTO}
                  value={categoria}
                  onValueChange={(val) => { if (val) setCategoria(val) }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_SACRAMENTO.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Descripción</Label>
              <textarea
                rows={3}
                required
                placeholder="Breve resumen de la preparación..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full p-2 text-sm rounded-md border bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="grid gap-2">
              <Label>Requisitos y Fechas</Label>
              <textarea
                rows={3}
                placeholder="Días de encuentro, papeles requeridos, etc."
                value={requisitos}
                onChange={(e) => setRequisitos(e.target.value)}
                className="w-full p-2 text-sm rounded-md border bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t mt-2">
              <Button type="button" variant="outline" className="cursor-pointer" onClick={() => setIsDialogOpen(false)}>
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
