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
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  SearchIcon,
  HeartHandshakeIcon,
  CreditCardIcon,
  DownloadIcon,
  EllipsisVerticalIcon,
  RepeatIcon,
  CopyIcon,
  ExternalLinkIcon,
  CalendarIcon,
  XIcon,
} from "lucide-react"
import {
  getDonaciones,
  fetchDonacionesFromDb,
  type DonacionItem,
} from "@/lib/data-store"

function formatMonto(monto: number, moneda = "UYU"): string {
  try {
    return new Intl.NumberFormat("es-UY", {
      style: "currency",
      currency: moneda || "UYU",
      maximumFractionDigits: 0,
    }).format(monto)
  } catch {
    return `$ ${monto} ${moneda}`
  }
}

function formatFecha(fechaStr?: string): string {
  if (!fechaStr) return "Reciente"
  try {
    const d = new Date(fechaStr)
    if (isNaN(d.getTime())) return fechaStr
    return d.toLocaleDateString("es-UY", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return fechaStr
  }
}

const FILTER_OPTIONS = [
  { value: "todos", label: "Todas las donaciones" },
  { value: "mensual", label: "Aportes mensuales" },
  { value: "unica_vez", label: "Donaciones puntuales" },
  { value: "approved", label: "Solo aprobadas" },
  { value: "pending", label: "Solo pendientes" },
]

const DATE_FILTER_OPTIONS = [
  { value: "todas", label: "Cualquier fecha" },
  { value: "hoy", label: "Hoy" },
  { value: "7dias", label: "Últimos 7 días" },
  { value: "este_mes", label: "Este mes" },
  { value: "30dias", label: "Últimos 30 días" },
  { value: "personalizado", label: "Rango personalizado..." },
]

function isWithinDateRange(
  dateStr?: string,
  filterType = "todas",
  customStart?: string,
  customEnd?: string
): boolean {
  if (filterType === "todas" && !customStart && !customEnd) return true
  if (!dateStr) return false

  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return true

  const now = new Date()

  if (filterType === "hoy") {
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    )
  }

  if (filterType === "7dias") {
    const limit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return d >= limit
  }

  if (filterType === "este_mes") {
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth()
    )
  }

  if (filterType === "30dias") {
    const limit = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    return d >= limit
  }

  if (filterType === "personalizado") {
    if (customStart) {
      const [year, month, day] = customStart.split("-").map(Number)
      const start = new Date(year, month - 1, day, 0, 0, 0, 0)
      if (d < start) return false
    }
    if (customEnd) {
      const [year, month, day] = customEnd.split("-").map(Number)
      const end = new Date(year, month - 1, day, 23, 59, 59, 999)
      if (d > end) return false
    }
    return true
  }

  return true
}

export function DonacionesView() {
  const [donaciones, setDonaciones] = React.useState<DonacionItem[]>([])
  const [searchTerm, setSearchTerm] = React.useState("")
  const [activeFilter, setActiveFilter] = React.useState<string>("todos")
  const [dateFilter, setDateFilter] = React.useState<string>("todas")
  const [customStartDate, setCustomStartDate] = React.useState<string>("")
  const [customEndDate, setCustomEndDate] = React.useState<string>("")
  const [selectedDonacion, setSelectedDonacion] = React.useState<DonacionItem | null>(null)
  const [copiedId, setCopiedId] = React.useState(false)

  const refresh = React.useCallback(async () => {
    setDonaciones(getDonaciones())
    try {
      const dbItems = await fetchDonacionesFromDb()
      if (dbItems && dbItems.length > 0) {
        setDonaciones(dbItems)
      }
    } catch {
      // Keep local
    }
  }, [])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  const filtered = donaciones.filter((d) => {
    const matchesSearch =
      !searchTerm ||
      (d.nombre_donante && d.nombre_donante.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.email_donante && d.email_donante.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.metodo_pago && d.metodo_pago.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.mp_payment_id && d.mp_payment_id.toLowerCase().includes(searchTerm.toLowerCase()))

    if (!matchesSearch) return false

    if (activeFilter === "mensual" && d.tipo !== "mensual") return false
    if (activeFilter === "unica_vez" && d.tipo !== "unica_vez") return false
    if (activeFilter === "approved" && d.estado !== "approved" && d.estado !== "authorized") return false
    if (activeFilter === "pending" && d.estado !== "pending" && d.estado !== "in_process") return false

    if (!isWithinDateRange(d.created_at, dateFilter, customStartDate, customEndDate)) {
      return false
    }

    return true
  })

  // Estadísticas rápidas estilo de la referencia visual
  const totalRecaudado = donaciones
    .filter((d) => d.estado === "approved" || d.estado === "authorized")
    .reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0)

  const totalMensuales = donaciones.filter(
    (d) => d.tipo === "mensual" && (d.estado === "approved" || d.estado === "authorized")
  ).length


  const handleExport = () => {
    const csv = filtered
      .map(
        (d) =>
          `"${d.id}","${d.nombre_donante || "Anónimo"}","${d.email_donante || ""}","${d.monto}","${d.moneda}","${d.tipo}","${d.estado}","${d.metodo_pago || ""}","${d.mp_payment_id || ""}","${formatFecha(d.created_at)}"`
      )
      .join("\n")
    const blob = new Blob(
      [
        "ID,Donante,Email,Monto,Moneda,Tipo,Estado,Metodo,MP_Payment_ID,Fecha\n" +
          csv,
      ],
      { type: "text/csv;charset=utf-8;" }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `donaciones_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  return (
    <div className="flex flex-col gap-5 py-4 md:gap-6 md:py-6">
      {/* ── Metric Summary Row ── */}
      <div className="flex flex-wrap items-center gap-6 sm:gap-10 lg:gap-14 px-4 lg:px-6">
        {/* Métrica 1: Recaudación */}
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-full bg-muted/60 dark:bg-muted/30 border border-border/50 flex items-center justify-center text-muted-foreground shrink-0">
            <HeartHandshakeIcon className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Recaudación</p>
            <p className="text-xl font-bold tracking-tight text-foreground mt-0.5">
              {formatMonto(totalRecaudado)}
            </p>
          </div>
        </div>

        <div className="h-8 w-px bg-border/60 hidden sm:block" />

        {/* Métrica 2: Aportantes mensuales */}
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-full bg-muted/60 dark:bg-muted/30 border border-border/50 flex items-center justify-center text-muted-foreground shrink-0">
            <RepeatIcon className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Sostenimiento mensual</p>
            <p className="text-xl font-bold tracking-tight text-foreground mt-0.5">
              {totalMensuales}
            </p>
          </div>
        </div>

        <div className="h-8 w-px bg-border/60 hidden sm:block" />

        {/* Métrica 3: Total de donaciones */}
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-full bg-muted/60 dark:bg-muted/30 border border-border/50 flex items-center justify-center text-muted-foreground shrink-0">
            <CreditCardIcon className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total donaciones</p>
            <p className="text-xl font-bold tracking-tight text-foreground mt-0.5">
              {donaciones.length}
            </p>
          </div>
        </div>
      </div>

      {/* ── Toolbar: Search, Type Filter, Date Filter & Export ── */}
      <div className="flex flex-col gap-3 px-4 lg:px-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-72">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por donante, email o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Select de Filtros de Estado/Tipo */}
            <Select
              items={FILTER_OPTIONS}
              value={activeFilter}
              onValueChange={(v) => {
                if (v !== null && v !== undefined) setActiveFilter(v)
              }}
            >
              <SelectTrigger className="h-9 w-44 text-xs cursor-pointer">
                <SelectValue placeholder="Filtrar por estado..." />
              </SelectTrigger>
              <SelectContent>
                {FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs cursor-pointer">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Select de Filtro de Fecha */}
            <Select
              items={DATE_FILTER_OPTIONS}
              value={dateFilter}
              onValueChange={(v) => {
                if (v !== null && v !== undefined) setDateFilter(v)
              }}
            >
              <SelectTrigger className="h-9 w-44 text-xs cursor-pointer gap-2">
                <CalendarIcon className="size-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Filtrar por fecha..." />
              </SelectTrigger>
              <SelectContent>
                {DATE_FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs cursor-pointer">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Botón Exportar */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-1.5 cursor-pointer text-xs h-9"
            >
              <DownloadIcon className="size-3.5" />
              <span>Exportar</span>
            </Button>
          </div>
        </div>

        {/* Inputs personalizados si selecciona rango personalizado */}
        {dateFilter === "personalizado" && (
          <div className="flex flex-wrap items-center gap-3 py-1.5 text-xs bg-muted/20 border border-border/50 rounded-lg px-3">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <CalendarIcon className="size-3.5" /> Período:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-[11px]">Desde</span>
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="h-8 text-xs w-36 cursor-pointer bg-background"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-[11px]">Hasta</span>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="h-8 text-xs w-36 cursor-pointer bg-background"
              />
            </div>
            {(customStartDate || customEndDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCustomStartDate("")
                  setCustomEndDate("")
                }}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <XIcon className="size-3.5 mr-1" />
                Limpiar fechas
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── Table Card ── */}
      <div className="px-4 lg:px-6">
        <Card className="p-0">
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground space-y-2">
                <HeartHandshakeIcon className="size-8 mx-auto text-muted-foreground/50 stroke-1" />
                <p>No se encontraron donaciones con los filtros seleccionados.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20 hover:bg-muted/20">
                    <TableHead className="px-4">Donante</TableHead>
                    <TableHead className="px-4">Monto</TableHead>
                    <TableHead className="px-4">Frecuencia</TableHead>
                    <TableHead className="px-4 hidden md:table-cell">Método</TableHead>
                    <TableHead className="px-4">Estado</TableHead>
                    <TableHead className="px-4 hidden sm:table-cell">Fecha</TableHead>
                    <TableHead className="text-right px-4"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d) => {
                    const isApproved = d.estado === "approved" || d.estado === "authorized"
                    const isPending = d.estado === "pending" || d.estado === "in_process"
                    const isMensual = d.tipo === "mensual"

                    return (
                      <TableRow
                        key={d.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedDonacion(d)}
                      >
                        {/* Donante: texto limpio sin avatar */}
                        <TableCell className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-sm text-foreground">
                              {d.nombre_donante || "Donante Anónimo"}
                            </span>
                            {d.email_donante && (
                              <span className="text-xs text-muted-foreground truncate max-w-[220px]">
                                {d.email_donante}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Monto */}
                        <TableCell className="px-4 py-3 whitespace-nowrap">
                          <span className="font-medium text-sm text-foreground">
                            {formatMonto(d.monto, d.moneda)}
                          </span>
                        </TableCell>

                        {/* Frecuencia: texto simple sin badges pesados */}
                        <TableCell className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                          {isMensual ? "Mensual" : "Puntual"}
                        </TableCell>

                        {/* Método de Pago */}
                        <TableCell className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground whitespace-nowrap">
                          {d.metodo_pago || "Mercado Pago"}
                        </TableCell>

                        {/* Estado: indicador limpio con punto sutil */}
                        <TableCell className="px-4 py-3 whitespace-nowrap text-xs">
                          {isApproved ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              Aprobada
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                              <span className="size-1.5 rounded-full bg-amber-500" />
                              Pendiente
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400 font-medium">
                              <span className="size-1.5 rounded-full bg-red-500" />
                              Rechazada
                            </span>
                          )}
                        </TableCell>

                        {/* Fecha */}
                        <TableCell className="px-4 py-3 hidden sm:table-cell text-xs text-muted-foreground whitespace-nowrap">
                          {formatFecha(d.created_at)}
                        </TableCell>

                        {/* Acciones: 3 puntos */}
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
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => setSelectedDonacion(d)}
                              >
                                <HeartHandshakeIcon className="size-4 mr-2" />
                                Ver detalle
                              </DropdownMenuItem>

                              {d.mp_payment_id && (
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={() => handleCopyId(d.mp_payment_id!)}
                                >
                                  <CopyIcon className="size-4 mr-2" />
                                  Copiar ID de pago
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Diálogo de Detalle de Donación ── */}
      <Dialog
        open={Boolean(selectedDonacion)}
        onOpenChange={(open) => !open && setSelectedDonacion(null)}
      >
        <DialogContent className="sm:max-w-[420px]">
          {selectedDonacion && (() => {
            const isApproved =
              selectedDonacion.estado === "approved" || selectedDonacion.estado === "authorized"
            const isPending =
              selectedDonacion.estado === "pending" || selectedDonacion.estado === "in_process"

            return (
              <>
                <DialogHeader className="text-left">
                  <DialogTitle className="text-base font-semibold">
                    Comprobante de Donación
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Detalle de la transacción registrada
                  </DialogDescription>
                </DialogHeader>

                <div className="py-2">
                  {/* Monto principal */}
                  <div className="text-center py-4 bg-muted/40 rounded-lg mb-3">
                    <p className="text-2xl font-bold tracking-tight text-foreground">
                      {formatMonto(selectedDonacion.monto, selectedDonacion.moneda)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isApproved
                        ? "Donación aprobada"
                        : isPending
                        ? "Pago pendiente de acreditación"
                        : "Donación no completada"}
                    </p>
                  </div>

                  {/* Lista de detalles limpia */}
                  <div className="divide-y divide-border/60 text-xs">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Estado</span>
                      <span className="font-medium">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Aprobada
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                            <span className="size-1.5 rounded-full bg-amber-500" />
                            Pendiente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400">
                            <span className="size-1.5 rounded-full bg-red-500" />
                            Rechazada
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Frecuencia</span>
                      <span className="font-medium text-foreground">
                        {selectedDonacion.tipo === "mensual" ? "Aporte mensual" : "Donación puntual"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Donante</span>
                      <span className="font-medium text-foreground">
                        {selectedDonacion.nombre_donante || "Donante Anónimo"}
                      </span>
                    </div>

                    {selectedDonacion.email_donante && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-muted-foreground">Correo</span>
                        <span className="font-medium text-foreground truncate max-w-[200px]">
                          {selectedDonacion.email_donante}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Medio de pago</span>
                      <span className="font-medium text-foreground">
                        {selectedDonacion.metodo_pago || "Mercado Pago"}
                      </span>
                    </div>

                    {selectedDonacion.mp_payment_id && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-muted-foreground">ID de pago</span>
                        <div className="flex items-center gap-1 font-medium text-foreground">
                          <span>{selectedDonacion.mp_payment_id}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyId(selectedDonacion.mp_payment_id!)}
                            className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                            title="Copiar ID"
                          >
                            <CopyIcon className="size-3" />
                          </button>
                          {copiedId && <span className="text-[10px] text-emerald-600">Copiado</span>}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Fecha</span>
                      <span className="font-medium text-foreground">
                        {formatFecha(selectedDonacion.created_at)}
                      </span>
                    </div>

                    {selectedDonacion.datos_adicionales?.ticket_url && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-muted-foreground">Cupón de pago</span>
                        <a
                          href={selectedDonacion.datos_adicionales.ticket_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          Ver cupón <ExternalLinkIcon className="size-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs cursor-pointer"
                    onClick={() => setSelectedDonacion(null)}
                  >
                    Cerrar
                  </Button>
                </DialogFooter>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
