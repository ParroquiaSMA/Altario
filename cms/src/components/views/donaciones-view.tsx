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
  ArchiveIcon,
  ArchiveRestoreIcon,
} from "lucide-react"
import {
  getDonaciones,
  fetchDonacionesFromDb,
  toggleArchivarDonacion,
  type DonacionItem,
} from "@/lib/data-store"
import { cn } from "@/lib/utils"

function formatMonto(monto: number, moneda = "UYU"): string {
  try {
    const num = Number(monto) || 0
    const hasDecimals = num % 1 !== 0
    return new Intl.NumberFormat("es-UY", {
      style: "currency",
      currency: moneda || "UYU",
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(num)
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
  const [verArchivadas, setVerArchivadas] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [activeFilter, setActiveFilter] = React.useState<string>("todos")
  const [dateFilter, setDateFilter] = React.useState<string>("todas")
  const [customStartDate, setCustomStartDate] = React.useState<string>("")
  const [customEndDate, setCustomEndDate] = React.useState<string>("")
  const [selectedDonacion, setSelectedDonacion] = React.useState<DonacionItem | null>(null)
  const [copiedId, setCopiedId] = React.useState(false)

  const refresh = React.useCallback(async () => {
    try {
      const dbItems = await fetchDonacionesFromDb()
      setDonaciones(dbItems || [])
    } catch {
      setDonaciones([])
    }
  }, [])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  const donacionesActivas = donaciones.filter((d) => !d.archivada)
  const donacionesArchivadas = donaciones.filter((d) => d.archivada)

  const filtered = donaciones.filter((d) => {
    if (verArchivadas ? !d.archivada : d.archivada) return false

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

  // Estadísticas de donaciones activas
  const donacionesAprobadas = donacionesActivas.filter(
    (d) => d.estado === "approved" || d.estado === "authorized"
  )

  const totalRecaudado = donacionesAprobadas.reduce(
    (acc, curr) => acc + (Number(curr.monto) || 0),
    0
  )

  const totalNetoRecaudado = donacionesAprobadas.reduce(
    (acc, curr) =>
      acc +
      (curr.monto_neto !== undefined
        ? Number(curr.monto_neto)
        : Number(curr.monto) || 0),
    0
  )

  const totalMensuales = donacionesActivas.filter(
    (d) => d.tipo === "mensual" && (d.estado === "approved" || d.estado === "authorized")
  ).length

  const handleExport = () => {
    const csv = filtered
      .map(
        (d) =>
          `"${d.id}","${d.nombre_donante || "Anónimo"}","${d.email_donante || ""}","${d.monto}","${d.comision ?? 0}","${d.monto_neto ?? d.monto}","${d.moneda}","${d.tipo}","${d.estado}","${d.metodo_pago || ""}","${d.mp_payment_id || ""}","${formatFecha(d.created_at)}"`
      )
      .join("\n")
    const blob = new Blob(
      [
        "ID,Donante,Email,Monto_Bruto,Comision_MP,Monto_Neto,Moneda,Tipo,Estado,Metodo,MP_Payment_ID,Fecha\n" +
          csv,
      ],
      { type: "text/csv;charset=utf-8;" }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `donaciones_${verArchivadas ? "archivadas" : "activas"}_${new Date().toISOString().split("T")[0]}.csv`
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
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-2 sm:gap-6 lg:gap-8 px-3 sm:px-4 lg:px-6">
        {/* Métrica 1: Recaudación bruta */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-2.5 sm:p-0 bg-muted/40 sm:bg-transparent rounded-xl border sm:border-0 border-border/60">
          <div className="size-8 sm:size-10 rounded-full bg-background sm:bg-muted/60 dark:sm:bg-muted/30 border border-border/50 flex items-center justify-center text-muted-foreground shrink-0">
            <HeartHandshakeIcon className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate">Recaudación bruta</p>
            <p className="text-sm sm:text-lg font-bold tracking-tight text-foreground mt-0.5 truncate">
              {formatMonto(totalRecaudado)}
            </p>
          </div>
        </div>

        <div className="h-7 w-px bg-border/60 hidden sm:block" />

        {/* Métrica 2: Neto recibido */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-2.5 sm:p-0 bg-muted/40 sm:bg-transparent rounded-xl border sm:border-0 border-border/60">
          <div className="size-8 sm:size-10 rounded-full bg-background sm:bg-muted/60 dark:sm:bg-muted/30 border border-border/50 flex items-center justify-center text-muted-foreground shrink-0">
            <CreditCardIcon className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate">Neto recibido</p>
            <p className="text-sm sm:text-lg font-bold tracking-tight text-foreground mt-0.5 truncate">
              {formatMonto(totalNetoRecaudado)}
            </p>
          </div>
        </div>

        <div className="h-7 w-px bg-border/60 hidden sm:block" />

        {/* Métrica 3: Aportantes mensuales */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-2.5 sm:p-0 bg-muted/40 sm:bg-transparent rounded-xl border sm:border-0 border-border/60">
          <div className="size-8 sm:size-10 rounded-full bg-background sm:bg-muted/60 dark:sm:bg-muted/30 border border-border/50 flex items-center justify-center text-muted-foreground shrink-0">
            <RepeatIcon className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate">Mensuales</p>
            <p className="text-sm sm:text-lg font-bold tracking-tight text-foreground mt-0.5 truncate">
              {totalMensuales}
            </p>
          </div>
        </div>

        <div className="h-7 w-px bg-border/60 hidden sm:block" />

        {/* Métrica 4: Estado de lista */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-2.5 sm:p-0 bg-muted/40 sm:bg-transparent rounded-xl border sm:border-0 border-border/60">
          <div className="size-8 sm:size-10 rounded-full bg-background sm:bg-muted/60 dark:sm:bg-muted/30 border border-border/50 flex items-center justify-center text-muted-foreground shrink-0">
            {verArchivadas ? (
              <ArchiveIcon className="size-4" />
            ) : (
              <ArchiveRestoreIcon className="size-4" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate">
              {verArchivadas ? "Archivadas" : "Activas"}
            </p>
            <p className="text-sm sm:text-lg font-bold tracking-tight text-foreground mt-0.5 truncate">
              {verArchivadas ? donacionesArchivadas.length : donacionesActivas.length}
            </p>
          </div>
        </div>
      </div>

      {/* ── Toolbar: Search, Type Filter, Date Filter & Export ── */}
      <div className="flex flex-col gap-3 px-3 sm:px-4 lg:px-6">
        {/* Row 1: Switcher Activas / Archivadas + Exportar */}
        <div className="flex items-center justify-between gap-3 w-full">
          {/* Switcher Activas / Archivadas */}
          <div className="flex items-center rounded-lg border border-border/70 p-0.5 bg-muted/40">
            <button
              type="button"
              onClick={() => setVerArchivadas(false)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                !verArchivadas
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>Activas</span>
              <span className="rounded-full bg-primary/10 text-primary px-1.5 py-0.2 text-[10px] font-semibold">
                {donacionesActivas.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setVerArchivadas(true)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                verArchivadas
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ArchiveIcon className="size-3 text-muted-foreground" />
              <span>Archivadas</span>
              {donacionesArchivadas.length > 0 && (
                <span className="rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 text-[10px] font-semibold">
                  {donacionesArchivadas.length}
                </span>
              )}
            </button>
          </div>

          {/* Botón Exportar */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-1.5 cursor-pointer text-xs h-9 shrink-0"
          >
            <DownloadIcon className="size-3.5" />
            <span>Exportar CSV</span>
          </Button>
        </div>

        {/* Row 2: Search + Selects (aligned inline on desktop) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por donante, email o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs w-full bg-background"
            />
          </div>

          {/* Select de Filtros de Estado/Tipo */}
          <div className="w-full sm:w-52 shrink-0">
            <Select
              items={FILTER_OPTIONS}
              value={activeFilter}
              onValueChange={(v) => {
                if (v !== null && v !== undefined) setActiveFilter(v)
              }}
            >
              <SelectTrigger className="h-9 w-full text-xs cursor-pointer bg-background">
                <SelectValue>
                  {FILTER_OPTIONS.find((o) => o.value === activeFilter)?.label || "Todas las donaciones"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs cursor-pointer">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Select de Filtro de Fecha */}
          <div className="w-full sm:w-48 shrink-0">
            <Select
              items={DATE_FILTER_OPTIONS}
              value={dateFilter}
              onValueChange={(v) => {
                if (v !== null && v !== undefined) setDateFilter(v)
              }}
            >
              <SelectTrigger className="h-9 w-full text-xs cursor-pointer gap-1.5 bg-background">
                <CalendarIcon className="size-3.5 text-muted-foreground shrink-0" />
                <SelectValue>
                  {DATE_FILTER_OPTIONS.find((o) => o.value === dateFilter)?.label || "Cualquier fecha"}
                </SelectValue>
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
        </div>

        {/* Inputs personalizados si selecciona rango personalizado */}
        {dateFilter === "personalizado" && (
          <div className="flex flex-wrap items-center gap-3 py-2 text-xs bg-muted/20 border border-border/50 rounded-lg px-3">
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

      {/* ── Table & Cards View ── */}
      <div className="px-3 sm:px-4 lg:px-6">
        <Card className="p-0 overflow-hidden">
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="py-16 px-6 text-center space-y-3">
                <div className="size-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                  {verArchivadas ? (
                    <ArchiveIcon className="size-6 stroke-1.5" />
                  ) : (
                    <HeartHandshakeIcon className="size-6 stroke-1.5" />
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">
                    {verArchivadas ? "No hay donaciones archivadas" : "No hay donaciones registradas"}
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {searchTerm || activeFilter !== "todos" || dateFilter !== "todas"
                      ? "No se encontraron donaciones con los filtros seleccionados."
                      : "Las donaciones realizadas a través de la web o transferencias bancarias aparecerán aquí."}
                  </p>
                </div>
                {(searchTerm || activeFilter !== "todos" || dateFilter !== "todas") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("")
                      setActiveFilter("todos")
                      setDateFilter("todas")
                      setCustomStartDate("")
                      setCustomEndDate("")
                    }}
                    className="text-xs cursor-pointer mt-1"
                  >
                    Restablecer filtros
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto w-full">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableHead className="px-4">Donante</TableHead>
                        <TableHead className="px-4">Monto</TableHead>
                        <TableHead className="px-4">Frecuencia</TableHead>
                        <TableHead className="px-4">Método</TableHead>
                        <TableHead className="px-4">Estado</TableHead>
                        <TableHead className="px-4">Fecha</TableHead>
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

                            <TableCell className="px-4 py-3 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="font-medium text-sm text-foreground">
                                  {formatMonto(d.monto, d.moneda)}
                                </span>
                                {d.monto_neto !== undefined ? (
                                  <span className="text-[11px] text-muted-foreground font-normal">
                                    Neto: {formatMonto(d.monto_neto, d.moneda)}
                                  </span>
                                ) : null}
                              </div>
                            </TableCell>

                            <TableCell className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                              {isMensual ? "Mensual" : "Puntual"}
                            </TableCell>

                            <TableCell className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                              {d.metodo_pago || "Mercado Pago"}
                            </TableCell>

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

                            <TableCell className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                              {formatFecha(d.created_at)}
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

                                  <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={async () => {
                                      await toggleArchivarDonacion(d.id, !d.archivada)
                                      await refresh()
                                    }}
                                  >
                                    {d.archivada ? (
                                      <>
                                        <ArchiveRestoreIcon className="size-4 mr-2" />
                                        Desarchivar donación
                                      </>
                                    ) : (
                                      <>
                                        <ArchiveIcon className="size-4 mr-2" />
                                        Archivar donación
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards View */}
                <div className="md:hidden divide-y divide-border">
                  {filtered.map((d) => {
                    const isApproved = d.estado === "approved" || d.estado === "authorized"
                    const isPending = d.estado === "pending" || d.estado === "in_process"
                    const isMensual = d.tipo === "mensual"

                    return (
                      <div
                        key={d.id}
                        onClick={() => setSelectedDonacion(d)}
                        className="p-3.5 space-y-2 hover:bg-muted/40 transition-colors active:bg-muted cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-semibold text-sm text-foreground leading-tight block">
                              {d.nombre_donante || "Donante Anónimo"}
                            </span>
                            {d.email_donante && (
                              <span className="text-[11px] text-muted-foreground truncate block max-w-[200px]">
                                {d.email_donante}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col items-end shrink-0">
                            <span className="font-bold text-sm text-foreground tabular-nums">
                              {formatMonto(d.monto, d.moneda)}
                            </span>
                            {d.monto_neto !== undefined ? (
                              <span className="text-[10px] text-muted-foreground font-medium">
                                Neto: {formatMonto(d.monto_neto, d.moneda)}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-xs pt-0.5">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-medium text-muted-foreground">
                              {isMensual ? "Mensual" : "Puntual"}
                            </span>
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                Aprobada
                              </span>
                            ) : isPending ? (
                              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-[11px] font-medium">
                                <span className="size-1.5 rounded-full bg-amber-500" />
                                Pendiente
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 text-[11px] font-medium">
                                <span className="size-1.5 rounded-full bg-red-500" />
                                Rechazada
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                            <span>{formatFecha(d.created_at)}</span>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7 text-muted-foreground data-open:bg-muted cursor-pointer"
                                  />
                                }
                              >
                                <EllipsisVerticalIcon className="size-3.5" />
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

                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={async () => {
                                    await toggleArchivarDonacion(d.id, !d.archivada)
                                    await refresh()
                                  }}
                                >
                                  {d.archivada ? (
                                    <>
                                      <ArchiveRestoreIcon className="size-4 mr-2" />
                                      Desarchivar donación
                                    </>
                                  ) : (
                                    <>
                                      <ArchiveIcon className="size-4 mr-2" />
                                      Archivar donación
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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

      {/* ── Diálogo de Detalle de Donación ── */}
      <Dialog
        open={Boolean(selectedDonacion)}
        onOpenChange={(open) => !open && setSelectedDonacion(null)}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[420px] max-h-[85vh] overflow-y-auto">
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
                    {selectedDonacion.monto_neto !== undefined && (
                      <div className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                        <span>Neto acreditado: {formatMonto(selectedDonacion.monto_neto, selectedDonacion.moneda)}</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
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
                      <span className="text-muted-foreground">Monto aportado (bruto)</span>
                      <span className="font-semibold text-foreground">
                        {formatMonto(selectedDonacion.monto, selectedDonacion.moneda)}
                      </span>
                    </div>

                    {selectedDonacion.comision !== undefined && selectedDonacion.comision > 0 && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-muted-foreground">Comisión Mercado Pago</span>
                        <span className="font-medium text-amber-600 dark:text-amber-400">
                          - {formatMonto(selectedDonacion.comision, selectedDonacion.moneda)}
                        </span>
                      </div>
                    )}

                    {selectedDonacion.monto_neto !== undefined && (
                      <div className="flex justify-between items-center py-2 bg-emerald-500/10 px-2 rounded-md font-semibold">
                        <span className="text-foreground">Neto final en mano</span>
                        <span className="text-emerald-700 dark:text-emerald-400">
                          {formatMonto(selectedDonacion.monto_neto, selectedDonacion.moneda)}
                        </span>
                      </div>
                    )}

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

                <DialogFooter className="flex flex-row items-center justify-between gap-2 pt-2 sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs cursor-pointer gap-1.5"
                    onClick={async () => {
                      const newArchivada = !selectedDonacion.archivada
                      await toggleArchivarDonacion(selectedDonacion.id, newArchivada)
                      setSelectedDonacion({ ...selectedDonacion, archivada: newArchivada })
                      await refresh()
                    }}
                  >
                    {selectedDonacion.archivada ? (
                      <>
                        <ArchiveRestoreIcon className="size-3.5" />
                        <span>Restaurar a activas</span>
                      </>
                    ) : (
                      <>
                        <ArchiveIcon className="size-3.5" />
                        <span>Archivar donación</span>
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="text-xs cursor-pointer"
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
