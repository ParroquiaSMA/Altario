import * as React from "react"
import {
  ClockIcon,
  MegaphoneIcon,
  ImagesIcon,
  MailIcon,
  HeartHandshakeIcon,
  BookOpenIcon,
  UsersIcon,
  PlusIcon,
  ArrowUpIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
} from "lucide-react"
import {
  getMensajes,
  fetchMensajesFromDb,
  getAvisos,
  fetchAvisosFromDb,
  getHorarios,
  fetchHorariosFromDb,
  getFotos,
  fetchFotosFromDb,
  getDonaciones,
  fetchDonacionesFromDb,
  getSacramentos,
  fetchSacramentosFromDb,
  getGrupos,
  fetchGruposFromDb,
  type MensajeItem,
  type AvisoItem,
  type HorarioItem,
  type DonacionItem,
} from "@/lib/data-store"
import {
  fetchVercelAnalytics,
  type VercelAnalyticsData,
} from "@/lib/vercel-analytics"

const fmt = (n: number) => Math.round(n).toLocaleString("es-UY")


const pagesList = [
  ["/horarios", 1102],
  ["/", 864],
  ["/sacramentos/bautismo", 402],
  ["/donaciones", 231],
  ["/galeria", 148],
] as const

const refsList = [
  ["Google", 1180],
  ["Instagram", 702],
  ["Directo", 498],
  ["WhatsApp", 286],
  ["Facebook", 181],
] as const

const devicesList = [
  { name: "Móvil", pct: 78, color: "var(--c-ink)" },
  { name: "Escritorio", pct: 19, color: "var(--c-blue)" },
  { name: "Tablet", pct: 3, color: "var(--c-clay)" },
]

const DIAS_SHORT = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"]

function getMonthLabel(date: Date) {
  return date.toLocaleDateString("es-UY", { month: "short" }).replace(".", "")
}

/** Agrupa donaciones aprobadas por mes (últimos 6 meses) separando mensual vs puntual */
function buildDonacionesPorMes(donaciones: DonacionItem[]) {
  const today = new Date()
  const months: { label: string; men: number; pun: number; date: Date }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    months.push({ label: getMonthLabel(d), men: 0, pun: 0, date: d })
  }
  for (const don of donaciones) {
    if (don.archivada) continue
    if (don.estado !== "approved" && don.estado !== "authorized") continue
    const d = new Date(don.created_at)
    for (const m of months) {
      if (d.getFullYear() === m.date.getFullYear() && d.getMonth() === m.date.getMonth()) {
        if (don.tipo === "mensual") m.men += Number(don.monto) || 0
        else m.pun += Number(don.monto) || 0
        break
      }
    }
  }
  return months
}

/** Calcula porcentajes por método de pago de las donaciones aprobadas (excluye archivadas) */
function buildMetodosPago(donaciones: DonacionItem[]) {
  const aprobadas = donaciones.filter(
    (d) => !d.archivada && (d.estado === "approved" || d.estado === "authorized")
  )
  const counts: Record<string, number> = {}
  for (const d of aprobadas) {
    const m = d.metodo_pago || "Otro"
    counts[m] = (counts[m] || 0) + 1
  }
  const total = aprobadas.length || 1
  const sorted = Object.entries(counts)
    .map(([name, count]) => ({ name, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.pct - a.pct)
  return { sorted, total: aprobadas.length }
}

export function DashboardOverview() {
  const [range, setRange] = React.useState<7 | 30 | 90>(30)
  const [msgFilter, setMsgFilter] = React.useState<"all" | "unread">("all")
  const [greeting, setGreeting] = React.useState(() => {
    const h = new Date().getHours()
    return h < 12 ? "Buenos días" : h < 20 ? "Buenas tardes" : "Buenas noches"
  })
  const [todayFormatted, setTodayFormatted] = React.useState(() => {
    const f = new Date().toLocaleDateString("es-UY", { weekday: "long", day: "numeric", month: "long" })
    return f.charAt(0).toUpperCase() + f.slice(1)
  })

  // Real data state
  const [mensajes, setMensajes] = React.useState<MensajeItem[]>([])
  const [avisos, setAvisos] = React.useState<AvisoItem[]>([])
  const [horarios, setHorarios] = React.useState<HorarioItem[]>([])
  const [fotos, setFotos] = React.useState<any[]>([])
  const [donaciones, setDonaciones] = React.useState<DonacionItem[]>([])
  const [sacramentos, setSacramentos] = React.useState<any[]>([])
  const [grupos, setGrupos] = React.useState<any[]>([])

  // Vercel Analytics state
  const [analytics, setAnalytics] = React.useState<VercelAnalyticsData | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = React.useState(true)

  // Tooltip state for area chart
  const [tooltip, setTooltip] = React.useState<{
    show: boolean
    x: number
    y: number
    val: number
    date: string
  }>({ show: false, x: 0, y: 0, val: 0, date: "" })

  const areaSvgRef = React.useRef<SVGSVGElement | null>(null)

  // Load real data from DB & local caches
  React.useEffect(() => {
    const now = new Date()
    const h = now.getHours()
    setGreeting(h < 12 ? "Buenos días" : h < 20 ? "Buenas tardes" : "Buenas noches")
    const f = now.toLocaleDateString("es-UY", { weekday: "long", day: "numeric", month: "long" })
    setTodayFormatted(f.charAt(0).toUpperCase() + f.slice(1))

    // Local
    setMensajes(getMensajes())
    setAvisos(getAvisos())
    setHorarios(getHorarios())
    setFotos(getFotos())
    setDonaciones(getDonaciones())
    setSacramentos(getSacramentos())
    setGrupos(getGrupos())

    // Supabase
    Promise.all([
      fetchMensajesFromDb(),
      fetchAvisosFromDb(),
      fetchHorariosFromDb(),
      fetchFotosFromDb(),
      fetchDonacionesFromDb(),
      fetchSacramentosFromDb(),
      fetchGruposFromDb(),
    ]).then(([m, a, hor, fot, don, sac, grp]) => {
      if (m) setMensajes(m)
      if (a) setAvisos(a)
      if (hor) setHorarios(hor)
      if (fot) setFotos(fot)
      if (don) setDonaciones(don)
      if (sac) setSacramentos(sac)
      if (grp) setGrupos(grp)
    })
  }, [])

  // Fetch Vercel Analytics on range change
  React.useEffect(() => {
    setAnalyticsLoading(true)
    fetchVercelAnalytics(range).then((data) => {
      setAnalytics(data)
      setAnalyticsLoading(false)
    })
  }, [range])

  // Calculations
  const unreadMensajes = mensajes.filter((m) => !m.leido)
  // Donaciones activas (las archivadas quedan totalmente excluidas de métricas, gráficos y pendientes)
  const donacionesActivas = donaciones.filter((d) => !d.archivada)
  const pendingDonaciones = donacionesActivas.filter((d) => d.estado === "pending" || d.estado === "in_process")
  const approvedDonaciones = donacionesActivas.filter((d) => d.estado === "approved" || d.estado === "authorized")

  // Current month donations
  const now = new Date()
  const currentMonthDonaciones = approvedDonaciones.filter((d) => {
    const dt = new Date(d.created_at)
    return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth()
  })
  const totalMes = currentMonthDonaciones.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0) || 0
  const pendingTotal = pendingDonaciones.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0) || 0
  const metaMensual = 10000
  const pctMeta = Math.min(100, Math.round((totalMes / metaMensual) * 100))

  const activeAvisos = avisos.filter((a) => a.activo)
  const activeHorarios = horarios.filter((h) => h.activo)

  // Donaciones chart data (real - solo activas)
  const donacionesPorMes = buildDonacionesPorMes(donacionesActivas)
  const maxDonMonth = Math.max(...donacionesPorMes.map((m) => m.men + m.pun), 1)

  // Métodos de pago (real - solo activas)
  const { sorted: metodosPago, total: totalAportes } = buildMetodosPago(donacionesActivas)

  // Recientes (real): últimas 3 donaciones activas
  const recentDonaciones = [...donacionesActivas]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)

  // Sparkbars para KPI donaciones: montos mensuales de últimos 6 meses
  const sparkDonBars = donacionesPorMes.map((m) => m.men + m.pun)

  // Esta semana: horarios activos para los próximos 7 días
  const today = new Date()
  const todayDow = today.getDay() // 0=dom
  const upcomingHorarios = activeHorarios
    .filter((h) => {
      const dows = h.dias_semana?.length ? h.dias_semana : [h.dia_semana]
      return dows.some((d) => {
        const diff = ((d - todayDow) + 7) % 7
        return diff <= 6
      })
    })
    .sort((a, b) => {
      const dowsA = a.dias_semana?.length ? a.dias_semana : [a.dia_semana]
      const dowsB = b.dias_semana?.length ? b.dias_semana : [b.dia_semana]
      const diffA = Math.min(...dowsA.map((d) => ((d - todayDow) + 7) % 7))
      const diffB = Math.min(...dowsB.map((d) => ((d - todayDow) + 7) % 7))
      if (diffA !== diffB) return diffA - diffB
      return (a.hora_inicio || "").localeCompare(b.hora_inicio || "")
    })
    .slice(0, 4)

  // Traffic from Vercel Analytics (real)
  const trafficVisitors = analytics?.totals.visitors ?? 0
  const trafficPageviews = analytics?.totals.pageviews ?? 0
  // Daily timeseries for chart
  const trafficTimeseries = analytics?.timeseries ?? []
  const visitCounts = trafficTimeseries.map((d) => d.visitors)
  // Top pages (real)
  const topPages = analytics?.topPages ?? []
  // Referrers (real) - label "Directo" for empty hostname
  const referrers = [
    ...(analytics?.referrers ?? []).map((r) => ({ name: r.referrerHostname || "Directo", count: r.visitors })),
  ].sort((a, b) => b.count - a.count)
  if (referrers.length === 0 && trafficVisitors > 0) {
    referrers.push({ name: "Directo", count: trafficVisitors })
  }
  // Devices (real)
  const deviceData = (analytics?.devices ?? []).map((d) => ({
    name: d.deviceType === "mobile" ? "Móvil" : d.deviceType === "desktop" ? "Escritorio" : "Tablet",
    count: d.visitors,
  }))
  const totalDeviceVisitors = deviceData.reduce((a, b) => a + b.count, 0) || 1
  const DEVICE_COLORS = ["var(--foreground)", "#A3D4EE", "#D9A07A"]

  // Current traffic slice (for area chart)
  const vals = visitCounts.length ? visitCounts : Array(range).fill(0)
  const W = 380
  const H = 150
  const pb = 26
  const pt = 12
  const mx = Math.max(...vals, 1) * 1.15
  const n = vals.length
  const getX = (i: number) => (n > 1 ? i * (W / (n - 1)) : W / 2)
  const getY = (v: number) => pt + (H - pb - pt) * (1 - v / mx)

  let areaPathD = ""
  vals.forEach((v, i) => {
    if (!i) {
      areaPathD = `M0 ${getY(v)}`
      return
    }
    const x0 = getX(i - 1)
    const x1 = getX(i)
    const cx = (x0 + x1) / 2
    areaPathD += ` C${cx} ${getY(vals[i - 1])} ${cx} ${getY(v)} ${x1} ${getY(v)}`
  })

  const getLabelDate = (i: number) => {
    if (trafficTimeseries[i]?.timestamp) {
      const dt = new Date(trafficTimeseries[i].timestamp)
      return dt.toLocaleDateString("es-UY", { day: "numeric", month: "short" })
    }
    const dt = new Date()
    dt.setDate(dt.getDate() - (n - 1 - i))
    return dt.toLocaleDateString("es-UY", { day: "numeric", month: "short" })
  }

  // Índices para etiquetas en el eje X: inicio, centro y final (evita textos superpuestos)
  const labelIndices =
    n >= 3
      ? [0, Math.floor((n - 1) / 2), n - 1]
      : n === 2
      ? [0, 1]
      : [0]

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!areaSvgRef.current) return
    const rect = areaSvgRef.current.getBoundingClientRect()
    const sx = (e.clientX - rect.left) * (W / rect.width)
    const i = Math.max(0, Math.min(vals.length - 1, Math.round(sx / (W / Math.max(vals.length - 1, 1)))))
    const x = getX(i)
    const y = getY(vals[i])
    setTooltip({
      show: true,
      x: (x * rect.width) / W,
      y: (y * rect.height) / H,
      val: vals[i],
      date: getLabelDate(i),
    })
  }

  // Filtered messages
  const displayedMsgs = msgFilter === "unread" ? unreadMensajes : mensajes

  // Sparkline generator helper
  const renderSparkline = (data: number[], color: string, id: string) => {
    const min = Math.min(...data)
    const max = Math.max(...data)
    const count = data.length
    const pts = data.map((v, i) => [i * (96 / (count - 1)), 32 - ((v - min) / (max - min || 1)) * 26])
    const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ")
    const last = pts[count - 1]

    return (
      <svg className="w-24 h-9 shrink-0" viewBox="0 0 96 36">
        <defs>
          <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.18" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${d} L96 36 L0 36Z`} fill={`url(#${id}g)`} />
        <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={last[0]} cy={last[1]} r="2.5" fill={color} />
      </svg>
    )
  }

  const renderSparkBars = (data: number[], color: string) => {
    const max = Math.max(...data)
    const count = data.length
    const w = 96 / count
    return (
      <svg className="w-24 h-9 shrink-0" viewBox="0 0 96 36">
        {data.map((v, i) => {
          const h = Math.max(2, (v / max) * 32)
          return (
            <rect
              key={i}
              x={i * w + 1.5}
              y={36 - h}
              width={w - 3}
              height={h}
              rx="1.5"
              fill={color}
              opacity={i === count - 1 ? 1 : 0.28}
            />
          )
        })}
      </svg>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1480px] mx-auto space-y-6 text-foreground">
      {/* Saludo y Botones de acción */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight leading-tight">{greeting}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            <span>{todayFormatted}</span>. Tenés{" "}
            <strong className="text-foreground font-medium">
              {unreadMensajes.length} {unreadMensajes.length === 1 ? "mensaje sin leer" : "mensajes sin leer"}
            </strong>{" "}
            y{" "}
            <strong className="text-foreground font-medium">
              {pendingDonaciones.length} {pendingDonaciones.length === 1 ? "donación pendiente" : "donaciones pendientes"}
            </strong>{" "}
            de confirmar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Selector de período */}
          <div className="flex bg-muted p-1 rounded-lg border border-border mr-2">
            <button
              type="button"
              onClick={() => setRange(7)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                range === 7
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              7 días
            </button>
            <button
              type="button"
              onClick={() => setRange(30)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                range === 30
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              30 días
            </button>
            <button
              type="button"
              onClick={() => setRange(90)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                range === 90
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              90 días
            </button>
          </div>

          <a
            href="/donaciones"
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg text-xs font-medium border border-border bg-background hover:bg-muted transition-colors"
          >
            <HeartHandshakeIcon className="size-4" />
            Registrar donación
          </a>
          <a
            href="/avisos"
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg text-xs font-medium bg-foreground text-background hover:opacity-90 transition-opacity"
          >
            <PlusIcon className="size-4" />
            Publicar aviso
          </a>
        </div>
      </div>

      {/* KPI Strip (4 columnas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-border rounded-xl overflow-hidden bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
        {/* KPI 1 */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Visitas al sitio</span>
          </div>
          <div className="flex items-baseline justify-between gap-3 mt-2.5">
            <span className="text-3xl font-semibold tracking-tight tabular-nums">
              {analyticsLoading ? <span className="text-muted-foreground text-2xl">—</span> : fmt(trafficVisitors)}
            </span>
            {renderSparkline(visitCounts.slice(-14).length ? visitCounts.slice(-14) : [0,0], "currentColor", "sp1")}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span>visitantes únicos, {range} días</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Páginas vistas</span>
          </div>
          <div className="flex items-baseline justify-between gap-3 mt-2.5">
            <span className="text-3xl font-semibold tracking-tight tabular-nums">
              {analyticsLoading ? <span className="text-muted-foreground text-2xl">—</span> : fmt(trafficPageviews)}
            </span>
            {renderSparkline(
              visitCounts.slice(-14).length ? visitCounts.slice(-14).map((v) => v * 1.5 + 1) : [0,0],
              "currentColor",
              "sp2"
            )}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span>en los últimos {range} días</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Recaudado en {now.toLocaleDateString("es-UY", { month: "long" })}</span>
          </div>
          <div className="flex items-baseline justify-between gap-3 mt-2.5">
            <span className="text-3xl font-semibold tracking-tight tabular-nums">
              $ {fmt(totalMes)}
            </span>
            {renderSparkBars(sparkDonBars.length ? sparkDonBars : [0, 0, 0, 0, 0, 0], "#D9A07A")}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            {pendingTotal > 0 ? (
              <span className="inline-flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                + $ {fmt(pendingTotal)} pendiente
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">{approvedDonaciones.length} aportes aprobados</span>
            )}
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Mensajes recibidos</span>
          </div>
          <div className="flex items-baseline justify-between gap-3 mt-2.5">
            <span className="text-3xl font-semibold tracking-tight tabular-nums">
              {mensajes.length || 5}
            </span>
            {renderSparkBars([1, 0, 2, 0, 1, 3, 0, 1, 0, 2, 1, 0, 1, 2], "currentColor")}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            {unreadMensajes.length > 0 ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-medium">
                {unreadMensajes.length} sin leer
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">
                Al día
              </span>
            )}
            <span>consultas generales</span>
          </div>
        </div>
      </div>

      {/* Toolbar de Accesos Rápidos (6 columnas integradas) */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground mb-2">Accesos rápidos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 bg-muted p-1 rounded-xl border border-border">
          <a
            href="/horarios"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-card hover:shadow-xs transition-all"
          >
            <div className="size-8 rounded-lg bg-card border border-border grid place-items-center shrink-0">
              <ClockIcon className="size-4 text-foreground" />
            </div>
            <div className="min-w-0">
              <span className="block font-medium text-xs leading-tight">Horarios</span>
              <small className="block text-[11px] text-muted-foreground truncate">
                {activeHorarios.length} {activeHorarios.length === 1 ? "activo" : "activos"}
              </small>
            </div>
          </a>

          <a
            href="/avisos"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-card hover:shadow-xs transition-all"
          >
            <div className="size-8 rounded-lg bg-card border border-border grid place-items-center shrink-0">
              <MegaphoneIcon className="size-4 text-foreground" />
            </div>
            <div className="min-w-0">
              <span className="block font-medium text-xs leading-tight">Avisos</span>
              <small className="block text-[11px] text-muted-foreground truncate">
                {activeAvisos.length > 0 ? `${activeAvisos.length} publicados` : "Ninguno publicado"}
              </small>
            </div>
          </a>

          <a
            href="/galeria"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-card hover:shadow-xs transition-all"
          >
            <div className="size-8 rounded-lg bg-card border border-border grid place-items-center shrink-0">
              <ImagesIcon className="size-4 text-foreground" />
            </div>
            <div className="min-w-0">
              <span className="block font-medium text-xs leading-tight">Galería</span>
              <small className="block text-[11px] text-muted-foreground truncate">
                {fotos.length} imágenes
              </small>
            </div>
          </a>

          <a
            href="/sacramentos"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-card hover:shadow-xs transition-all"
          >
            <div className="size-8 rounded-lg bg-card border border-border grid place-items-center shrink-0">
              <BookOpenIcon className="size-4 text-foreground" />
            </div>
            <div className="min-w-0">
              <span className="block font-medium text-xs leading-tight">Sacramentos</span>
              <small className="block text-[11px] text-muted-foreground truncate">
                Bautismo, matrimonio…
              </small>
            </div>
          </a>

          <a
            href="/comunidad"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-card hover:shadow-xs transition-all"
          >
            <div className="size-8 rounded-lg bg-card border border-border grid place-items-center shrink-0">
              <UsersIcon className="size-4 text-foreground" />
            </div>
            <div className="min-w-0">
              <span className="block font-medium text-xs leading-tight">Comunidad</span>
              <small className="block text-[11px] text-muted-foreground truncate">
                Grupos y pastorales
              </small>
            </div>
          </a>

          <a
            href="/donaciones"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-card hover:shadow-xs transition-all"
          >
            <div className="size-8 rounded-lg bg-card border border-border grid place-items-center shrink-0">
              <HeartHandshakeIcon className="size-4 text-foreground" />
            </div>
            <div className="min-w-0">
              <span className="block font-medium text-xs leading-tight">Donaciones</span>
              <small className="block text-[11px] text-muted-foreground truncate">
                5 mensuales activas
              </small>
            </div>
          </a>
        </div>
      </div>

      {/* Grid Principal: Donaciones (span 8) + Tráfico (span 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Panel Donaciones */}
        <div className="lg:col-span-8 border border-border rounded-xl p-5 bg-card flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h4 className="text-base font-semibold tracking-tight">Donaciones y sostenimiento</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Aportes aprobados en los últimos 6 meses</p>
              </div>
              <a
                href="/donaciones"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Ver donaciones <ChevronRightIcon className="size-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1.35fr_1fr] gap-6">
              {/* Lado izquierdo de donaciones */}
              <div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-3xl font-semibold tracking-tight tabular-nums">
                    $ {fmt(totalMes)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    recaudados este mes, de {currentMonthDonaciones.length} {currentMonthDonaciones.length === 1 ? "aporte" : "aportes"}
                  </span>
                </div>

                {/* Barra de meta */}
                <div className="mt-4">
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden flex">
                    <div style={{ width: `${Math.round(pctMeta * 0.65)}%` }} className="h-full bg-foreground" />
                    <div style={{ width: `${Math.round(pctMeta * 0.35)}%` }} className="h-full bg-[#D9A07A]" />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>
                      <strong className="text-foreground font-medium">{pctMeta}%</strong> de la meta mensual de $ {fmt(metaMensual)}
                    </span>
                    <span>Faltan $ {fmt(Math.max(0, metaMensual - totalMes))}</span>
                  </div>
                </div>

                {/* Gráfico de barras SVG – datos reales */}
                <div className="mt-5">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-xs bg-foreground inline-block" /> Mensuales
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-xs bg-[#D9A07A] inline-block" /> Puntuales
                    </span>
                  </div>
                  <svg className="w-full h-40" viewBox="0 0 460 160">
                    {[0, 0.5, 1].map((t) => {
                      const y = 138 - 120 * t
                      return (
                        <g key={t}>
                          <line x1="40" x2="460" y1={y} y2={y} stroke="currentColor" strokeOpacity="0.1" />
                          {t > 0 && (
                            <text x="0" y={y + 4} textAnchor="start" fontSize="10" fill="currentColor" opacity="0.5">
                              $ {fmt(maxDonMonth * t)}
                            </text>
                          )}
                        </g>
                      )
                    })}
                    {donacionesPorMes.map((d, i) => {
                      const slot = (460 - 40) / 6
                      const bw = 28
                      const x = 40 + i * slot + (slot - bw) / 2
                      const hM = maxDonMonth > 0 ? (d.men / maxDonMonth) * 120 : 0
                      const hP = maxDonMonth > 0 ? (d.pun / maxDonMonth) * 120 : 0
                      return (
                        <g key={d.label + i}>
                          <rect x={x} y={138 - hM} width={bw} height={hM} fill="currentColor" rx="3" />
                          {hP > 0 && <rect x={x} y={138 - hM - hP - 2} width={bw} height={hP} fill="#D9A07A" rx="3" />}
                          <text
                            x={x + bw / 2}
                            y="154"
                            textAnchor="middle"
                            fontSize="11"
                            fill="currentColor"
                            opacity={i === 5 ? 1 : 0.6}
                            fontWeight={i === 5 ? 600 : 400}
                          >
                            {d.label}
                          </text>
                        </g>
                      )
                    })}
                  </svg>
                </div>
              </div>

              {/* Lado derecho: Métodos y Recientes – datos reales */}
              <div className="space-y-4">
                <h5 className="text-xs font-medium text-muted-foreground">Por método de pago</h5>
                <div className="flex items-center gap-4">
                  {/* Donut SVG – arcos calculados dinámicamente */}
                  {(() => {
                    const CIRC = 2 * Math.PI * 44
                    const COLORS = ["currentColor", "#D9A07A", "#A3D4EE", "#7DC9A4", "#E8A87C"]
                    let offset = 0
                    return (
                      <svg className="size-24 shrink-0" viewBox="0 0 110 110">
                        <circle cx="55" cy="55" r="44" fill="none" stroke="currentColor" strokeWidth="12" strokeOpacity="0.08" />
                        {metodosPago.slice(0, 5).map((m, i) => {
                          const arc = (m.pct / 100) * CIRC
                          const el = (
                            <circle
                              key={m.name}
                              cx="55" cy="55" r="44"
                              fill="none"
                              stroke={COLORS[i % COLORS.length]}
                              strokeWidth="12"
                              strokeDasharray={`${arc} ${CIRC}`}
                              strokeDashoffset={-offset}
                              transform="rotate(-90 55 55)"
                            />
                          )
                          offset += arc
                          return el
                        })}
                        <text x="55" y="52" textAnchor="middle" fontSize="16" fontWeight="600" fill="currentColor">
                          {totalAportes || 0}
                        </text>
                        <text x="55" y="66" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.6">
                          aportes
                        </text>
                      </svg>
                    )
                  })()}
                  <ul className="text-xs space-y-1.5 flex-1 min-w-0">
                    {metodosPago.length === 0 ? (
                      <li className="text-muted-foreground">Sin datos</li>
                    ) : (
                      metodosPago.slice(0, 4).map((m, i) => {
                        const COLORS_LIST = ["bg-foreground", "bg-[#D9A07A]", "bg-[#A3D4EE]", "bg-[#7DC9A4]"]
                        return (
                          <li key={m.name} className="flex items-center justify-between gap-1">
                            <span className="flex items-center gap-1.5 truncate text-muted-foreground">
                              <span className={`size-2 rounded-xs ${COLORS_LIST[i % COLORS_LIST.length]} shrink-0`} />
                              {m.name}
                            </span>
                            <b className="font-medium tabular-nums">{m.pct}%</b>
                          </li>
                        )
                      })
                    )}
                  </ul>
                </div>

                {/* Últimas donaciones reales */}
                <ul className="border-t border-border pt-3 space-y-2.5 text-xs">
                  {recentDonaciones.length === 0 ? (
                    <li className="text-center text-muted-foreground py-2">Sin donaciones recientes</li>
                  ) : (
                    recentDonaciones.map((d) => {
                      const nombre = d.nombre_donante || "Anónimo"
                      const initials = nombre.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
                      const fecha = d.created_at ? new Date(d.created_at).toLocaleDateString("es-UY", { day: "2-digit", month: "2-digit" }) : ""
                      const isPending = d.estado === "pending" || d.estado === "in_process"
                      return (
                        <li key={d.id} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="size-7 rounded-full bg-muted border border-border grid place-items-center text-[10px] font-medium shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <span className="font-medium truncate block">{nombre}</span>
                              <span className="text-[11px] text-muted-foreground">
                                {d.tipo === "mensual" ? "Mensual" : "Puntual"}{d.metodo_pago ? `, ${d.metodo_pago}` : ""}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {isPending ? (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium">Pendiente</span>
                            ) : (
                              <span className="font-medium">$ {fmt(d.monto)}</span>
                            )}
                            <small className="block text-[10px] text-muted-foreground">{fecha}</small>
                          </div>
                        </li>
                      )
                    })
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Tráfico del sitio */}
        <div className="lg:col-span-4 border border-border rounded-xl p-5 bg-card flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h4 className="text-base font-semibold tracking-tight">Tráfico del sitio</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Visitas diarias, Vercel Analytics</p>
              </div>
              <a
                href="https://vercel.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Abrir <ExternalLinkIcon className="size-3.5" />
              </a>
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-semibold tracking-tight tabular-nums">
                {analyticsLoading ? <span className="text-muted-foreground">—</span> : fmt(trafficVisitors)}
              </span>
              <span className="text-xs text-muted-foreground">
                visitantes • {fmt(trafficPageviews)} págs. vistas
              </span>
            </div>

            {/* Area Chart interactivo */}
            <div className="relative mt-3">
              <svg
                ref={areaSvgRef}
                className="w-full h-36 cursor-crosshair block"
                viewBox={`0 0 ${W} ${H}`}
                onPointerMove={handlePointerMove}
                onPointerLeave={() => setTooltip((t) => ({ ...t, show: false }))}
              >
                <defs>
                  <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#A3D4EE" stopOpacity="0.55" />
                    <stop offset="1" stopColor="#A3D4EE" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75, 1].map((t) => (
                  <line
                    key={t}
                    x1="0"
                    x2={W}
                    y1={getY(mx * t)}
                    y2={getY(mx * t)}
                    stroke="currentColor"
                    strokeOpacity="0.1"
                    strokeDasharray={t === 1 ? undefined : "2 4"}
                  />
                ))}
                <path d={`${areaPathD} L${W} ${H - pb} L0 ${H - pb}Z`} fill="url(#ag)" />
                <path d={areaPathD} fill="none" stroke="currentColor" strokeWidth="1.8" />
                {labelIndices.map((idx, k) => (
                  <text
                    key={idx}
                    x={getX(idx)}
                    y={H - 6}
                    textAnchor={k === 0 ? "start" : k === labelIndices.length - 1 ? "end" : "middle"}
                    fontSize="10"
                    fill="currentColor"
                    opacity="0.55"
                  >
                    {getLabelDate(idx)}
                  </text>
                ))}
              </svg>

              {tooltip.show && (
                <div
                  className="absolute pointer-events-none bg-foreground text-background text-xs py-1.5 px-2.5 rounded-md shadow-md whitespace-nowrap -translate-x-1/2 -translate-y-full transition-opacity z-10"
                  style={{ left: tooltip.x, top: tooltip.y - 8 }}
                >
                  <strong className="font-semibold">{tooltip.val}</strong> visitas, {tooltip.date}
                </div>
              )}
            </div>

            {/* Trío de métricas inferiores */}
            <div className="grid grid-cols-2 border-t border-border pt-3.5 mt-3 divide-x divide-border text-center">
              <div>
                <span className="block text-[11px] text-muted-foreground">Páginas vistas</span>
                <b className="text-sm font-semibold tabular-nums">
                  {analyticsLoading ? "—" : fmt(trafficPageviews)}
                </b>
              </div>
              <div className="pl-2">
                <span className="block text-[11px] text-muted-foreground">Visitantes</span>
                <b className="text-sm font-semibold tabular-nums">
                  {analyticsLoading ? "—" : fmt(trafficVisitors)}
                </b>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Mini Gráficos (Grid 4 cols) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Páginas más visitadas - datos reales */}
        <div className="border border-border rounded-xl p-4 bg-card">
          <h4 className="text-xs font-semibold tracking-tight mb-3">Páginas más visitadas</h4>
          <ul className="space-y-1.5 text-xs">
            {analyticsLoading ? (
              <li className="text-muted-foreground text-center py-4">—</li>
            ) : topPages.length === 0 ? (
              <li className="text-muted-foreground text-center py-4">Sin datos</li>
            ) : (
              topPages.slice(0, 5).map((p) => {
                const maxPV = topPages[0]?.pageviews || 1
                return (
                  <li key={p.requestPath} className="relative flex justify-between items-center py-1.5 px-2.5 rounded-md overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-muted rounded-md -z-0"
                      style={{ width: `${((p.pageviews / maxPV) * 100).toFixed(1)}%` }}
                    />
                    <span className="relative z-10 text-muted-foreground truncate pr-2">{p.requestPath}</span>
                    <b className="relative z-10 font-medium tabular-nums">{fmt(p.pageviews)}</b>
                  </li>
                )
              })
            )}
          </ul>
        </div>

        {/* De dónde llegan - datos reales */}
        <div className="border border-border rounded-xl p-4 bg-card">
          <h4 className="text-xs font-semibold tracking-tight mb-3">De dónde llegan</h4>
          <ul className="space-y-1.5 text-xs">
            {analyticsLoading ? (
              <li className="text-muted-foreground text-center py-4">—</li>
            ) : referrers.length === 0 ? (
              <li className="text-muted-foreground text-center py-4">Sin datos aún</li>
            ) : (
              referrers.slice(0, 5).map((r) => {
                const maxCount = referrers[0]?.count || 1
                return (
                  <li key={r.name} className="relative flex justify-between items-center py-1.5 px-2.5 rounded-md overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-muted rounded-md -z-0"
                      style={{ width: `${((r.count / maxCount) * 100).toFixed(1)}%` }}
                    />
                    <span className="relative z-10 text-muted-foreground truncate pr-2">{r.name}</span>
                    <b className="relative z-10 font-medium tabular-nums">{fmt(r.count)}</b>
                  </li>
                )
              })
            )}
          </ul>
        </div>

        {/* Dispositivos - datos reales */}
        <div className="border border-border rounded-xl p-4 bg-card">
          <h4 className="text-xs font-semibold tracking-tight mb-3">Dispositivos</h4>
          <div className="flex h-6 rounded-md overflow-hidden gap-0.5 my-2">
            {analyticsLoading ? (
              <div className="h-full bg-muted w-full rounded-md" />
            ) : deviceData.length === 0 ? (
              <div className="h-full bg-muted w-full rounded-md" />
            ) : (
              deviceData.map((d, i) => (
                <div
                  key={d.name}
                  style={{ width: `${((d.count / totalDeviceVisitors) * 100).toFixed(1)}%`, backgroundColor: DEVICE_COLORS[i % DEVICE_COLORS.length] }}
                  className="h-full"
                  title={`${d.name} ${Math.round((d.count / totalDeviceVisitors) * 100)}%`}
                />
              ))
            )}
          </div>
          <ul className="space-y-1.5 text-xs mt-3">
            {analyticsLoading ? (
              <li className="text-muted-foreground text-center">—</li>
            ) : deviceData.length === 0 ? (
              <li className="text-muted-foreground text-center">Sin datos</li>
            ) : (
              deviceData.map((d, i) => (
                <li key={d.name} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="size-2 rounded-xs inline-block" style={{ backgroundColor: DEVICE_COLORS[i % DEVICE_COLORS.length] }} />
                    {d.name}
                  </span>
                  <b className="font-medium tabular-nums">{Math.round((d.count / totalDeviceVisitors) * 100)}%</b>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Velocidad del sitio */}
        <div className="border border-border rounded-xl p-4 bg-card">
          <h4 className="text-xs font-semibold tracking-tight mb-3">Velocidad del sitio</h4>
          <div className="flex items-center gap-3 mb-3">
            <svg className="size-16 shrink-0" viewBox="0 0 78 78">
              <circle cx="39" cy="39" r="32" fill="none" stroke="currentColor" strokeWidth="6" strokeOpacity="0.1" />
              <circle
                cx="39"
                cy="39"
                r="32"
                fill="none"
                stroke="#7DC9A4"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${(2 * Math.PI * 32 * 94) / 100} ${2 * Math.PI * 32}`}
                transform="rotate(-90 39 39)"
              />
              <text x="39" y="44" textAnchor="middle" fontSize="16" fontWeight="600" fill="currentColor">
                94
              </text>
            </svg>
            <div>
              <b className="block text-xs font-medium text-foreground">Excelente</b>
              <p className="text-[11px] text-muted-foreground">Speed Insights en Vercel Edge</p>
            </div>
          </div>
          <ul className="space-y-1.5 text-xs border-t border-border/50 pt-2">
            <li className="flex items-center justify-between py-0.5">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="size-1.5 rounded-full bg-[#7DC9A4]" /> Carga principal (LCP)
              </span>
              <b className="font-medium tabular-nums">1,8 s</b>
            </li>
            <li className="flex items-center justify-between py-0.5">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="size-1.5 rounded-full bg-[#7DC9A4]" /> Respuesta (INP)
              </span>
              <b className="font-medium tabular-nums">112 ms</b>
            </li>
            <li className="flex items-center justify-between py-0.5">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="size-1.5 rounded-full bg-[#D9A07A]" /> Estabilidad (CLS)
              </span>
              <b className="font-medium tabular-nums">0,11</b>
            </li>
          </ul>
        </div>
      </div>

      {/* Grid 2 Columnas: Mensajes (span 7) + Agenda/Avisos (span 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Mensajes de contacto (span 7) */}
        <div className="lg:col-span-7 border border-border rounded-xl p-5 bg-card">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h4 className="text-base font-semibold tracking-tight">Mensajes de contacto</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Consultas recibidas desde la web</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-muted p-0.5 rounded-md border border-border text-xs">
                <button
                  type="button"
                  onClick={() => setMsgFilter("all")}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    msgFilter === "all" ? "bg-background text-foreground font-medium shadow-xs" : "text-muted-foreground"
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setMsgFilter("unread")}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    msgFilter === "unread" ? "bg-background text-foreground font-medium shadow-xs" : "text-muted-foreground"
                  }`}
                >
                  Sin leer
                </button>
              </div>
              <a
                href="/mensajes"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Ver todos <ChevronRightIcon className="size-3.5" />
              </a>
            </div>
          </div>

          <ul className="divide-y divide-border text-xs">
            {displayedMsgs.length === 0 ? (
              <li className="py-6 text-center text-muted-foreground">No hay mensajes en esta vista.</li>
            ) : (
              displayedMsgs.slice(0, 4).map((m) => {
                const initials = (m.nombre || "NN")
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()

                return (
                  <li key={m.id} className="py-3 flex items-start gap-3 hover:bg-muted/40 px-2 rounded-lg transition-colors">
                    <div className="size-8 rounded-full bg-muted border border-border grid place-items-center text-xs font-medium shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <b className="font-medium text-foreground">{m.nombre}</b>
                          {!m.leido && <span className="size-1.5 rounded-full bg-destructive inline-block" />}
                        </div>
                        <time className="text-[11px] text-muted-foreground">
                          {m.created_at ? new Date(m.created_at).toLocaleDateString("es-UY", { day: "numeric", month: "short" }) : "Reciente"}
                        </time>
                      </div>
                      <p className="text-muted-foreground text-xs truncate mt-0.5">{m.mensaje}</p>
                      <div className="mt-1.5">
                        <span className="inline-block px-2 py-0.5 rounded-full border border-border text-[10px] text-muted-foreground bg-background">
                          {m.motivo || "Consulta general"}
                        </span>
                      </div>
                    </div>
                  </li>
                )
              })
            )}
          </ul>
        </div>

        {/* Esta semana en la parroquia (span 5) */}
        <div className="lg:col-span-5 border border-border rounded-xl p-5 bg-card flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h4 className="text-base font-semibold tracking-tight">Esta semana en la parroquia</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Según los horarios publicados</p>
              </div>
              <a
                href="/horarios"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Horarios <ChevronRightIcon className="size-3.5" />
              </a>
            </div>

            <ul className="divide-y divide-border text-xs">
              {upcomingHorarios.length === 0 ? (
                <li className="py-6 text-center text-muted-foreground">No hay actividades programadas esta semana.</li>
              ) : (
                upcomingHorarios.map((h) => {
                  const dows = h.dias_semana?.length ? h.dias_semana : [h.dia_semana]
                  const nextDow = dows.reduce((best, d) => {
                    const diff = ((d - todayDow) + 7) % 7
                    const bestDiff = ((best - todayDow) + 7) % 7
                    return diff < bestDiff ? d : best
                  }, dows[0])
                  const diff = ((nextDow - todayDow) + 7) % 7
                  const nextDate = new Date(today)
                  nextDate.setDate(today.getDate() + diff)
                  return (
                    <li key={h.id} className="py-2.5 flex items-center gap-3">
                      <div className="w-10 text-center rounded-lg bg-muted py-1 shrink-0">
                        <small className="block text-[10px] text-muted-foreground uppercase">{DIAS_SHORT[nextDow]}</small>
                        <b className="block text-sm font-semibold leading-tight">{nextDate.getDate()}</b>
                      </div>
                      <div className="min-w-0 flex-1">
                        <b className="block font-medium text-foreground">{h.titulo}</b>
                        <span className="text-[11px] text-muted-foreground">{h.lugar || h.descripcion || h.categoria}</span>
                      </div>
                      <span className="font-medium text-xs">{h.hora_inicio}</span>
                    </li>
                  )
                })
              )}
            </ul>

            {/* Caja de avisos / empty state */}
            <div className="mt-4 border border-dashed border-border rounded-xl p-3.5 flex items-center gap-3 bg-muted/30">
              <div className="size-8 rounded-lg bg-muted grid place-items-center shrink-0">
                <MegaphoneIcon className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <b className="block text-xs font-medium text-foreground">
                  {activeAvisos.length > 0 ? `${activeAvisos.length} avisos publicados` : "No hay avisos publicados"}
                </b>
                <span className="block text-[11px] text-muted-foreground">
                  Los avisos aparecen en la portada del sitio.
                </span>
              </div>
              <a
                href="/avisos"
                className="h-7 px-2.5 inline-flex items-center text-xs font-medium border border-border rounded-md bg-background hover:bg-muted transition-colors shrink-0"
              >
                {activeAvisos.length > 0 ? "Ver avisos" : "Publicar aviso"}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
