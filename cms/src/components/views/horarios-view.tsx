import * as React from "react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { PlusIcon, SearchIcon, Trash2Icon, Edit3Icon, EllipsisVerticalIcon } from "lucide-react"
import { getHorarios, addHorario, updateHorario, deleteHorario, type HorarioItem } from "@/lib/data-store"
import { fetchCatalogFromDb, type CatalogOption } from "@/lib/catalog"

const DIAS = [
  { value: "0", label: "Domingo" },
  { value: "1", label: "Lunes" },
  { value: "2", label: "Martes" },
  { value: "3", label: "Miércoles" },
  { value: "4", label: "Jueves" },
  { value: "5", label: "Viernes" },
  { value: "6", label: "Sábado" },
]

export function HorariosView() {
  const [horarios, setHorarios] = React.useState<HorarioItem[]>([])
  const [tiposCatalogo, setTiposCatalogo] = React.useState<CatalogOption[]>([])
  const [lugaresCatalogo, setLugaresCatalogo] = React.useState<CatalogOption[]>([])
  const [searchTerm, setSearchTerm] = React.useState("")
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<HorarioItem | null>(null)

  const [diaSemana, setDiaSemana] = React.useState("0")
  const [horaInicio, setHoraInicio] = React.useState("09:00")
  const [horaFin, setHoraFin] = React.useState("10:00")
  const [categoria, setCategoria] = React.useState("misa")
  const [titulo, setTitulo] = React.useState("")
  const [lugar, setLugar] = React.useState("Iglesia Principal")
  const [descripcion, setDescripcion] = React.useState("")

  const refresh = React.useCallback(async () => {
    setHorarios(getHorarios())
    // Fetch directly from backend DB tables
    const [tipos, lugares] = await Promise.all([
      fetchCatalogFromDb("tipos_horario"),
      fetchCatalogFromDb("lugares"),
    ])
    setTiposCatalogo(tipos.filter((t) => t.activo))
    setLugaresCatalogo(lugares.filter((l) => l.activo))
  }, [])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  const filtered = horarios.filter((h) =>
    h.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.lugar?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleOpenNew = async () => {
    // Refresh catalog tables from DB
    const [tipos, lugares] = await Promise.all([
      fetchCatalogFromDb("tipos_horario"),
      fetchCatalogFromDb("lugares"),
    ])
    const activeTipos = tipos.filter((t) => t.activo)
    const activeLugares = lugares.filter((l) => l.activo)
    setTiposCatalogo(activeTipos)
    setLugaresCatalogo(activeLugares)

    setEditingItem(null)
    setDiaSemana("0")
    setHoraInicio("09:00")
    setHoraFin("10:00")
    setCategoria(activeTipos[0]?.codigo || "misa")
    setTitulo("")
    setLugar(activeLugares[0]?.nombre || "Iglesia Principal")
    setDescripcion("")
    setIsDialogOpen(true)
  }

  const handleOpenEdit = async (item: HorarioItem) => {
    const [tipos, lugares] = await Promise.all([
      fetchCatalogFromDb("tipos_horario"),
      fetchCatalogFromDb("lugares"),
    ])
    setTiposCatalogo(tipos.filter((t) => t.activo))
    setLugaresCatalogo(lugares.filter((l) => l.activo))

    setEditingItem(item)
    setDiaSemana(String(item.dia_semana))
    setHoraInicio(item.hora_inicio || "09:00")
    setHoraFin(item.hora_fin || "")
    setCategoria(item.categoria || "misa")
    setTitulo(item.titulo || "")
    setLugar(item.lugar || "Iglesia Principal")
    setDescripcion(item.descripcion || "")
    setIsDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titulo.trim()) return
    const data = {
      dia_semana: Number(diaSemana),
      hora_inicio: horaInicio,
      hora_fin: horaFin || null,
      categoria,
      titulo: titulo.trim(),
      lugar: lugar.trim(),
      descripcion: descripcion.trim(),
      activo: true,
    }
    if (editingItem) {
      await updateHorario(editingItem.id, data)
    } else {
      await addHorario({ ...data, orden: horarios.length + 1 })
    }
    refresh()
    setIsDialogOpen(false)
  }

  const handleDelete = async (id: string) => {
    await deleteHorario(id)
    setHorarios((prev) => prev.filter((h) => h.id !== id))
  }

  const getCategoriaLabel = (code: string) => {
    const found = tiposCatalogo.find((t) => t.codigo === code)
    return found ? found.nombre : code
  }

  const getDiaLabel = (diaNum: number | string) => {
    const found = DIAS.find((d) => d.value === String(diaNum))
    return found ? found.label : "Domingo"
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 lg:px-6">
        <div className="relative w-full sm:w-80">
          <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input placeholder="Buscar horarios..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
        </div>
        <Button onClick={handleOpenNew} className="gap-2 w-full sm:w-auto cursor-pointer">
          <PlusIcon className="size-4" />Nuevo Horario
        </Button>
      </div>

      <div className="px-4 lg:px-6">
        <Card className="p-0">
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No se encontraron horarios.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="px-4">Celebración</TableHead>
                    <TableHead className="px-4">Día</TableHead>
                    <TableHead className="px-4">Horario</TableHead>
                    <TableHead className="px-4 hidden md:table-cell">Lugar</TableHead>
                    <TableHead className="px-4">Tipo</TableHead>
                    <TableHead className="text-right px-4"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((h) => (
                    <TableRow key={h.id} className="cursor-pointer" onClick={() => handleOpenEdit(h)}>
                      <TableCell className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{h.titulo}</span>
                          {h.descripcion && <span className="text-xs text-muted-foreground truncate max-w-xs">{h.descripcion}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm whitespace-nowrap">{getDiaLabel(h.dia_semana)}</TableCell>
                      <TableCell className="px-4 py-3 text-sm whitespace-nowrap">{h.hora_inicio}{h.hora_fin ? ` - ${h.hora_fin}` : ""}</TableCell>
                      <TableCell className="px-4 py-3 hidden md:table-cell text-sm text-muted-foreground whitespace-nowrap">{h.lugar}</TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant="secondary" className="text-xs font-normal capitalize">
                          {getCategoriaLabel(h.categoria)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8 text-muted-foreground data-open:bg-muted cursor-pointer" />}>
                            <EllipsisVerticalIcon className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem className="cursor-pointer" onClick={() => handleOpenEdit(h)}><Edit3Icon />Editar</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" className="cursor-pointer" onClick={() => handleDelete(h.id)}><Trash2Icon />Eliminar</DropdownMenuItem>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar Horario" : "Nuevo Horario"}</DialogTitle>
            <DialogDescription>Configuración de misas y servicios parroquiales.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Día</Label>
                <Select value={diaSemana} onValueChange={(v) => { if (v !== null && v !== undefined) setDiaSemana(v) }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Día" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic Select from 'tipos_horario' catalog table */}
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select value={categoria} onValueChange={(v) => { if (v) setCategoria(v) }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposCatalogo.length === 0 ? (
                      <SelectItem value="misa">Misa</SelectItem>
                    ) : (
                      tiposCatalogo.map((t) => (
                        <SelectItem key={t.id} value={t.codigo}>
                          {t.nombre}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Hora inicio</Label>
                <Input type="time" required value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Hora fin</Label>
                <Input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Título</Label>
              <Input placeholder="Ej: Misa Comunitaria" required value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            </div>

            {/* Dynamic Select from 'lugares' catalog table */}
            <div className="grid gap-2">
              <Label>Lugar</Label>
              <Select value={lugar} onValueChange={(v) => { if (v) setLugar(v) }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Lugar" />
                </SelectTrigger>
                <SelectContent>
                  {lugaresCatalogo.length === 0 ? (
                    <SelectItem value="Iglesia Principal">Iglesia Principal</SelectItem>
                  ) : (
                    lugaresCatalogo.map((l) => (
                      <SelectItem key={l.id} value={l.nombre}>
                        {l.nombre}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Descripción</Label>
              <Input placeholder="Detalle o nota..." value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
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
