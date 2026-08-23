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
} from "lucide-react"
import { getAvisos, addAviso, updateAviso, deleteAviso, type AvisoItem } from "@/lib/data-store"

export function AvisosView() {
  const [avisos, setAvisos] = React.useState<AvisoItem[]>([])
  const [searchTerm, setSearchTerm] = React.useState("")
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<AvisoItem | null>(null)

  const [fecha, setFecha] = React.useState("")
  const [titulo, setTitulo] = React.useState("")
  const [descripcion, setDescripcion] = React.useState("")

  const refresh = React.useCallback(() => {
    setAvisos(getAvisos())
  }, [])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  const filtered = avisos.filter((a) =>
    a.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleOpenNew = () => {
    setEditingItem(null)
    setFecha(new Date().toISOString().split("T")[0])
    setTitulo("")
    setDescripcion("")
    setIsDialogOpen(true)
  }

  const handleEdit = (item: AvisoItem) => {
    setEditingItem(item)
    setFecha(item.fecha || "")
    setTitulo(item.titulo || "")
    setDescripcion(item.descripcion || "")
    setIsDialogOpen(true)
  }

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!titulo.trim() || !fecha) return
    if (editingItem) {
      updateAviso(editingItem.id, { fecha, titulo: titulo.trim(), descripcion: descripcion.trim() })
    } else {
      addAviso({ fecha, titulo: titulo.trim(), descripcion: descripcion.trim(), activo: true, orden: avisos.length + 1 })
    }
    refresh()
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    deleteAviso(id)
    setAvisos((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 lg:px-6">
        <div className="relative w-full sm:w-80">
          <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar avisos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={handleOpenNew} className="gap-2 w-full sm:w-auto cursor-pointer">
          <PlusIcon className="size-4" />
          Nuevo Aviso
        </Button>
      </div>

      {/* Table Card */}
      <div className="px-4 lg:px-6">
        <Card className="p-0">
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No se encontraron avisos.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="px-4">Título</TableHead>
                    <TableHead className="px-4 hidden sm:table-cell">Descripción</TableHead>
                    <TableHead className="px-4">Fecha</TableHead>
                    <TableHead className="px-4">Estado</TableHead>
                    <TableHead className="text-right px-4"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => (
                    <TableRow key={a.id} className="cursor-pointer" onClick={() => handleEdit(a)}>
                      <TableCell className="px-4 py-3 font-medium text-sm">{a.titulo}</TableCell>
                      <TableCell className="px-4 py-3 hidden sm:table-cell text-sm text-muted-foreground max-w-md truncate">{a.descripcion}</TableCell>
                      <TableCell className="px-4 py-3 text-sm whitespace-nowrap">{a.fecha}</TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant="outline" className="gap-1.5 text-emerald-600 border-emerald-300">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          Publicado
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={<Button variant="ghost" size="icon" className="size-8 text-muted-foreground data-open:bg-muted cursor-pointer" />}
                          >
                            <EllipsisVerticalIcon className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem className="cursor-pointer" onClick={() => handleEdit(a)}>
                              <Edit3Icon />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" className="cursor-pointer" onClick={() => handleDelete(a.id)}>
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

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar Aviso" : "Nuevo Aviso"}</DialogTitle>
            <DialogDescription>Publicá novedades para la comunidad en la web.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="flex flex-col gap-4 py-2">
            <div className="grid gap-2">
              <Label>Fecha del evento o publicación</Label>
              <Input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Título</Label>
              <Input placeholder="Ej: Fiesta Patronal" required value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Descripción</Label>
              <Textarea placeholder="Detalles del aviso..." required rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="cursor-pointer">Cancelar</Button>
              <Button type="submit" className="cursor-pointer">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
