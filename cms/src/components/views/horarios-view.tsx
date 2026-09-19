import * as React from "react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { PlusIcon, SearchIcon, Trash2Icon, Edit3Icon, EllipsisVerticalIcon, XIcon, CheckCheckIcon } from "lucide-react"
import {
  getHorarios,
  fetchHorariosFromDb,
  addHorario,
  updateHorario,
  deleteHorario,
  deleteHorarios,
  type HorarioItem,
} from "@/lib/data-store"
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

  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  const [isConfirmBulkOpen, setIsConfirmBulkOpen] = React.useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false)

  const [selectedDias, setSelectedDias] = React.useState<number[]>([0])
  const [horaInicio, setHoraInicio] = React.useState("09:00")
  const [horaFin, setHoraFin] = React.useState("10:00")
  const [categoria, setCategoria] = React.useState("misa")
  const [titulo, setTitulo] = React.useState("")
  const [lugar, setLugar] = React.useState("Iglesia Principal")
  const [descripcion, setDescripcion] = React.useState("")

  const refresh = React.useCallback(async () => {
    // Fetch directly from backend DB tables
    const [tipos, lugares, dbHorarios] = await Promise.all([
      fetchCatalogFromDb("tipos_horario"),
      fetchCatalogFromDb("lugares"),
      fetchHorariosFromDb(),
    ])
    setTiposCatalogo(tipos.filter((t) => t.activo))
    setLugaresCatalogo(lugares.filter((l) => l.activo))
    setHorarios(dbHorarios || [])
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
    setSelectedDias([0])
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
    const dias = Array.isArray(item.dias_semana) && item.dias_semana.length > 0
      ? item.dias_semana
      : [item.dia_semana]
    setSelectedDias(dias)
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
    if (!titulo.trim() || selectedDias.length === 0) return

    const sortedDias = [...selectedDias].sort((a, b) => a - b)
    const itemData = {
      hora_inicio: horaInicio,
      hora_fin: horaFin || null,
      categoria,
      titulo: titulo.trim(),
      lugar: lugar.trim(),
      descripcion: descripcion.trim(),
      activo: true,
      dia_semana: sortedDias[0] ?? 0,
      dias_semana: sortedDias,
    }

    try {
      if (editingItem) {
        await updateHorario(editingItem.id, itemData)
      } else {
        await addHorario({
          ...itemData,
          orden: horarios.length + 1,
        })
      }
      refresh()
      setIsDialogOpen(false)
    } catch (err: any) {
      console.error("[Horarios] Error al guardar:", err)
      alert("Error al guardar en la base de datos: " + (err.message || err))
    }
  }

  const allFilteredIds = React.useMemo(() => filtered.map((h) => h.id), [filtered])
  const isAllSelected = filtered.length > 0 && allFilteredIds.every((id) => selectedIds.includes(id))
  const isSomeSelected = filtered.some((h) => selectedIds.includes(h.id)) && !isAllSelected

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)))
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])))
    }
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    setIsBulkDeleting(true)
    try {
      await deleteHorarios(selectedIds)
      setSelectedIds([])
      setIsConfirmBulkOpen(false)
      await refresh()
    } catch (e: any) {
      console.error("[Horarios] Error al eliminar horarios seleccionados:", e)
      alert("Error al eliminar horarios: " + (e.message || e))
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este horario?")) return
    try {
      await deleteHorario(id)
      setSelectedIds((prev) => prev.filter((x) => x !== id))
      setHorarios((prev) => prev.filter((h) => h.id !== id))
    } catch (err: any) {
      console.error("[Horarios] Error al eliminar:", err)
      alert("Error al eliminar horario: " + (err.message || err))
    }
  }

  const getCategoriaLabel = (code: string) => {
    const found = tiposCatalogo.find((t) => t.codigo === code)
    return found ? found.nombre : code
  }

  const getDiaLabel = (item: HorarioItem) => {
    const dias = Array.isArray(item.dias_semana) && item.dias_semana.length > 0
      ? item.dias_semana
      : [item.dia_semana]

    if (dias.length === 7) return "Todos los días"
    if (dias.length === 5 && [1, 2, 3, 4, 5].every((d) => dias.includes(d))) return "Lunes a Viernes"
    if (dias.length === 2 && dias.includes(0) && dias.includes(6)) return "Sábado y Domingo"

    const sorted = [...dias].sort((a, b) => a - b)
    const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
    return sorted.map((d) => DIAS_CORTOS[d] ?? "").filter(Boolean).join(", ")
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 pb-20">
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
        <Card className="p-0 overflow-hidden">
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No se encontraron horarios.</div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto w-full">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="w-12 px-3 text-center">
                          <Checkbox
                            checked={isAllSelected}
                            indeterminate={isSomeSelected}
                            onCheckedChange={toggleSelectAll}
                            aria-label="Seleccionar todos"
                          />
                        </TableHead>
                        <TableHead className="px-4">Celebración</TableHead>
                        <TableHead className="px-4">Día(s)</TableHead>
                        <TableHead className="px-4">Horario</TableHead>
                        <TableHead className="px-4 hidden md:table-cell">Lugar</TableHead>
                        <TableHead className="px-4">Tipo</TableHead>
                        <TableHead className="text-right px-4"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((h) => {
                        const isSelected = selectedIds.includes(h.id)
                        return (
                          <TableRow
                            key={h.id}
                            data-state={isSelected ? "selected" : undefined}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? "bg-muted/40 hover:bg-muted/60" : ""
                            }`}
                            onClick={() => handleOpenEdit(h)}
                          >
                            <TableCell
                              className="w-12 px-3 text-center"
                              onClick={(e) => {
                                e.stopPropagation()
                              }}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleSelectOne(h.id)}
                                aria-label={`Seleccionar ${h.titulo}`}
                              />
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{h.titulo}</span>
                                {h.descripcion && <span className="text-xs text-muted-foreground truncate max-w-xs">{h.descripcion}</span>}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-sm font-medium whitespace-nowrap">{getDiaLabel(h)}</TableCell>
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
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-border">
                  {filtered.map((h) => {
                    const isSelected = selectedIds.includes(h.id)
                    return (
                      <div
                        key={h.id}
                        onClick={() => handleOpenEdit(h)}
                        className={`p-3.5 space-y-2 hover:bg-muted/40 transition-colors active:bg-muted cursor-pointer ${
                          isSelected ? "bg-muted/30" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleSelectOne(h.id)}
                                aria-label={`Seleccionar ${h.titulo}`}
                              />
                            </div>
                            <div>
                              <span className="font-semibold text-sm text-foreground leading-tight block">
                                {h.titulo}
                              </span>
                              <span className="text-[11px] text-muted-foreground block">
                                {getDiaLabel(h)} • {h.hora_inicio}{h.hora_fin ? ` - ${h.hora_fin}` : ""}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <Badge variant="secondary" className="text-[10px] font-normal capitalize px-1.5 py-0">
                              {getCategoriaLabel(h.categoria)}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={<Button variant="ghost" size="icon" className="size-7 text-muted-foreground data-open:bg-muted cursor-pointer" />}
                              >
                                <EllipsisVerticalIcon className="size-3.5" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36">
                                <DropdownMenuItem className="cursor-pointer" onClick={() => handleOpenEdit(h)}>
                                  <Edit3Icon className="size-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive" className="cursor-pointer" onClick={() => handleDelete(h.id)}>
                                  <Trash2Icon className="size-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {h.descripcion && (
                          <p className="text-xs text-muted-foreground line-clamp-2 pl-6">
                            {h.descripcion}
                          </p>
                        )}

                        <div className="text-[11px] text-muted-foreground pl-6 flex items-center gap-1.5">
                          <span>📍 {h.lugar}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar Horario" : "Nuevo Horario"}</DialogTitle>
            <DialogDescription>Configuración de misas y servicios parroquiales.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="flex flex-col gap-4 py-2">
            {/* Días de la semana */}
            <div className="grid gap-2">
              <Label>Días</Label>
              <div className="grid grid-cols-7 gap-1.5">
                {DIAS.map((d) => {
                  const val = Number(d.value)
                  const isSelected = selectedDias.includes(val)
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => {
                        setSelectedDias((prev) =>
                          prev.includes(val)
                            ? prev.length > 1
                              ? prev.filter((x) => x !== val)
                              : prev
                            : [...prev, val].sort((a, b) => a - b)
                        )
                      }}
                      className={`h-9 rounded-md text-sm font-medium transition-colors cursor-pointer border ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-input hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {d.label.slice(0, 3)}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Dynamic Select from 'tipos_horario' catalog table */}
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select
                  items={
                    tiposCatalogo.length === 0
                      ? [{ value: "misa", label: "Misa" }]
                      : tiposCatalogo.map((t) => ({ value: t.codigo, label: t.nombre }))
                  }
                  value={categoria}
                  onValueChange={(v) => { if (v) setCategoria(v) }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Tipo de celebración" />
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

              {/* Dynamic Select from 'lugares' catalog table */}
              <div className="grid gap-2">
                <Label>Lugar</Label>
                <Select
                  items={
                    lugaresCatalogo.length === 0
                      ? [{ value: "Iglesia Principal", label: "Iglesia Principal" }]
                      : lugaresCatalogo.map((l) => ({ value: l.nombre, label: l.nombre }))
                  }
                  value={lugar}
                  onValueChange={(v) => { if (v) setLugar(v) }}
                >
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

            <div className="grid gap-2">
              <Label>Descripción</Label>
              <Input placeholder="Detalle o nota..." value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="cursor-pointer">Cancelar</Button>
              <Button type="submit" disabled={selectedDias.length === 0} className="cursor-pointer">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Barra flotante de acciones masivas */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200 max-w-[calc(100vw-1.5rem)]">
          <div className="flex items-center gap-1.5 sm:gap-3 rounded-full border border-border/80 bg-background/95 px-3 sm:px-4 py-2 shadow-2xl backdrop-blur-md overflow-x-auto max-w-full">
            <div className="flex items-center gap-1.5 pl-1 shrink-0">
              <Badge variant="default" className="rounded-full px-2 py-0.5 text-xs font-bold">
                {selectedIds.length}
              </Badge>
              <span className="text-xs font-medium text-foreground whitespace-nowrap hidden sm:inline">
                {selectedIds.length === 1 ? "seleccionado" : "seleccionados"}
              </span>
            </div>

            <div className="h-4 w-px bg-border shrink-0" />

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSelectAll}
              className="h-8 text-xs cursor-pointer px-2 sm:px-2.5 shrink-0"
            >
              <CheckCheckIcon className="size-3.5 mr-1" />
              <span className="hidden sm:inline">{isAllSelected ? "Deseleccionar" : `Todos (${filtered.length})`}</span>
              <span className="sm:hidden">{isAllSelected ? "Ninguno" : "Todos"}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds([])}
              className="h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer px-2 sm:px-2.5 shrink-0"
            >
              <XIcon className="size-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Limpiar</span>
            </Button>

            <div className="h-4 w-px bg-border shrink-0" />

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsConfirmBulkOpen(true)}
              className="h-8 gap-1.5 text-xs font-medium cursor-pointer shadow-xs px-2.5 sm:px-3 shrink-0"
            >
              <Trash2Icon className="size-3.5" />
              <span className="hidden sm:inline">Borrar seleccionados ({selectedIds.length})</span>
              <span className="sm:hidden">Borrar ({selectedIds.length})</span>
            </Button>
          </div>
        </div>
      )}

      {/* Diálogo de confirmación para borrado masivo */}
      <Dialog open={isConfirmBulkOpen} onOpenChange={setIsConfirmBulkOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2Icon className="size-5" />
              ¿Eliminar {selectedIds.length} {selectedIds.length === 1 ? "horario" : "horarios"}?
            </DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminarán permanentemente de la base de datos los siguientes horarios:
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-48 overflow-y-auto rounded-lg border divide-y bg-muted/20 text-xs">
            {horarios
              .filter((h) => selectedIds.includes(h.id))
              .map((h) => (
                <div key={h.id} className="flex items-center justify-between p-2.5 hover:bg-muted/40">
                  <div className="flex flex-col truncate pr-2">
                    <span className="font-medium text-foreground truncate">{h.titulo}</span>
                    <span className="text-muted-foreground text-[11px]">{h.lugar}</span>
                  </div>
                  <span className="text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                    {getDiaLabel(h)} - {h.hora_inicio}
                  </span>
                </div>
              ))}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmBulkOpen(false)}
              disabled={isBulkDeleting}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="gap-2 cursor-pointer"
            >
              {isBulkDeleting ? "Eliminando..." : `Sí, eliminar (${selectedIds.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
