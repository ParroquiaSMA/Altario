"use client"

import * as React from "react"
import {
  getGrupos,
  fetchGruposFromDb,
  addGrupo,
  updateGrupo,
  deleteGrupo,
  type GrupoItem,
} from "@/lib/data-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

export function ComunidadView() {
  const [items, setItems] = React.useState<GrupoItem[]>([])
  const [searchTerm, setSearchTerm] = React.useState("")
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<GrupoItem | null>(null)

  // Form states
  const [nombre, setNombre] = React.useState("")
  const [descripcion, setDescripcion] = React.useState("")
  const [horarioEncuentro, setHorarioEncuentro] = React.useState("")

  const refresh = React.useCallback(async () => {
    setItems(getGrupos())
    const fromDb = await fetchGruposFromDb()
    if (fromDb && fromDb.length > 0) {
      setItems(fromDb)
    }
  }, [])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  const filtered = items.filter((g) =>
    g.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.horario_encuentro && g.horario_encuentro.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleOpenNew = () => {
    setEditingItem(null)
    setNombre("")
    setDescripcion("")
    setHorarioEncuentro("")
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (item: GrupoItem) => {
    setEditingItem(item)
    setNombre(item.nombre)
    setDescripcion(item.descripcion)
    setHorarioEncuentro(item.horario_encuentro || "")
    setIsDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || !descripcion.trim()) return

    try {
      if (editingItem) {
        await updateGrupo(editingItem.id, {
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          horario_encuentro: horarioEncuentro.trim(),
        })
      } else {
        await addGrupo({
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          horario_encuentro: horarioEncuentro.trim(),
          orden: items.length + 1,
        })
      }

      refresh()
      setIsDialogOpen(false)
    } catch (err: any) {
      console.error("[Comunidad] Error al guardar grupo:", err)
      alert("Error al guardar grupo en la base de datos: " + (err.message || err))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este grupo parroquial?")) return
    try {
      await deleteGrupo(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch (err: any) {
      console.error("[Comunidad] Error al eliminar grupo:", err)
      alert("Error al eliminar grupo de la base de datos: " + (err.message || err))
    }
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 lg:px-6">
        <div className="relative w-full sm:w-80">
          <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar grupos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={handleOpenNew} className="gap-2 w-full sm:w-auto cursor-pointer">
          <PlusIcon className="size-4" />
          Nuevo Grupo
        </Button>
      </div>

      {/* Table Card */}
      <div className="px-4 lg:px-6">
        <Card className="p-0">
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No se encontraron grupos.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="px-4">Nombre</TableHead>
                    <TableHead className="px-4">Encuentros</TableHead>
                    <TableHead className="px-4 hidden sm:table-cell">Descripción</TableHead>
                    <TableHead className="text-right px-4"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((g) => (
                    <TableRow
                      key={g.id}
                      className="cursor-pointer"
                      onClick={() => handleOpenEdit(g)}
                    >
                      <TableCell className="px-4 py-3 font-medium text-sm">{g.nombre}</TableCell>
                      <TableCell className="px-4 py-3 text-sm whitespace-nowrap">{g.horario_encuentro || "—"}</TableCell>
                      <TableCell className="px-4 py-3 hidden sm:table-cell text-sm text-muted-foreground max-w-md truncate">
                        {g.descripcion}
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
                            <DropdownMenuItem className="cursor-pointer" onClick={() => handleOpenEdit(g)}>
                              <Edit3Icon />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" className="cursor-pointer" onClick={() => handleDelete(g.id)}>
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
            <DialogTitle>{editingItem ? "Editar Grupo" : "Nuevo Grupo"}</DialogTitle>
            <DialogDescription>
              Configuración de grupos parroquiales y horarios de reunión.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="flex flex-col gap-4 py-2">
            <div className="grid gap-2">
              <Label>Nombre del Grupo</Label>
              <Input
                placeholder="Ej: Cáritas, Coro, Grupo de Jóvenes..."
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Días y Horarios de Encuentro</Label>
              <Input
                placeholder="Ej: Viernes 20:00 o Sábados 10:00 a 11:30"
                value={horarioEncuentro}
                onChange={(e) => setHorarioEncuentro(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Descripción</Label>
              <textarea
                rows={3}
                required
                placeholder="Breve descripción de las actividades..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
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
