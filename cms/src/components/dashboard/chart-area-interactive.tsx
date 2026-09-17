"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HeartHandshakeIcon, MessageSquareIcon, TrendingUpIcon } from "lucide-react"

// Datos dinámicos para los últimos 90 días (hasta septiembre 2026)
const GENERATED_DATA = [
  // Junio 2026
  { date: "2026-06-21", donaciones: 16500, consultas: 14, intenciones: 28 },
  { date: "2026-06-28", donaciones: 22000, consultas: 19, intenciones: 34 },
  // Julio 2026
  { date: "2026-07-05", donaciones: 18400, consultas: 16, intenciones: 31 },
  { date: "2026-07-12", donaciones: 27500, consultas: 24, intenciones: 45 },
  { date: "2026-07-19", donaciones: 21000, consultas: 18, intenciones: 36 },
  { date: "2026-07-26", donaciones: 34000, consultas: 27, intenciones: 52 },
  // Agosto 2026
  { date: "2026-08-02", donaciones: 29500, consultas: 22, intenciones: 41 },
  { date: "2026-08-09", donaciones: 24800, consultas: 20, intenciones: 38 },
  { date: "2026-08-16", donaciones: 38000, consultas: 31, intenciones: 60 },
  { date: "2026-08-23", donaciones: 31200, consultas: 25, intenciones: 47 },
  { date: "2026-08-30", donaciones: 42500, consultas: 33, intenciones: 65 },
  // Septiembre 2026
  { date: "2026-09-06", donaciones: 36000, consultas: 28, intenciones: 54 },
  { date: "2026-09-10", donaciones: 45000, consultas: 36, intenciones: 70 },
  { date: "2026-09-13", donaciones: 52000, consultas: 42, intenciones: 82 },
  { date: "2026-09-17", donaciones: 49500, consultas: 39, intenciones: 76 },
]

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")
  const [metric, setMetric] = React.useState<"donaciones" | "actividad">("donaciones")

  React.useEffect(() => {
    if (isMobile) setTimeRange("30d")
  }, [isMobile])

  const filteredData = React.useMemo(() => {
    const referenceDate = new Date("2026-09-17T23:59:59")
    let daysToSubtract = 90
    if (timeRange === "30d") daysToSubtract = 30
    else if (timeRange === "7d") daysToSubtract = 7

    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)

    return GENERATED_DATA.filter((item) => new Date(item.date) >= startDate)
  }, [timeRange])

  // Estadísticas del período seleccionado
  const totalDonaciones = React.useMemo(
    () => filteredData.reduce((sum, item) => sum + item.donaciones, 0),
    [filteredData]
  )
  const totalConsultas = React.useMemo(
    () => filteredData.reduce((sum, item) => sum + item.consultas, 0),
    [filteredData]
  )
  const totalIntenciones = React.useMemo(
    () => filteredData.reduce((sum, item) => sum + item.intenciones, 0),
    [filteredData]
  )

  const isDonaciones = metric === "donaciones"

  return (
    <Card className="@container/card border-border/70 shadow-xs">
      <CardHeader className="flex flex-col gap-4 pb-2 @[768px]/card:flex-row @[768px]/card:items-start @[768px]/card:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold tracking-tight sm:text-lg">
              Evolución Parroquial
            </CardTitle>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <TrendingUpIcon className="size-3" />
              +14.2% este mes
            </span>
          </div>
          <CardDescription className="text-xs sm:text-sm mt-1">
            Métricas actualizadas de recaudación solidaria e interacción pastoral
          </CardDescription>

          {/* Mini KPIs del período */}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-[#C9A96A]" />
              <span className="font-medium text-foreground">
                {formatCurrency(totalDonaciones)}
              </span>
              <span>recaudados</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-[#38bdf8]" />
              <span className="font-medium text-foreground">{totalConsultas}</span>
              <span>consultas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-[#a855f7]" />
              <span className="font-medium text-foreground">{totalIntenciones}</span>
              <span>intenciones de misa</span>
            </div>
          </div>
        </div>

        <CardAction className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
          {/* Selector de métrica */}
          <Tabs
            value={metric}
            onValueChange={(val) => setMetric(val as any)}
            className="w-auto"
          >
            <TabsList className="h-8 bg-muted/60 p-0.5">
              <TabsTrigger
                value="donaciones"
                className="h-7 px-3 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
              >
                <HeartHandshakeIcon className="size-3.5 mr-1.5 text-[#C9A96A]" />
                Donaciones ($)
              </TabsTrigger>
              <TabsTrigger
                value="actividad"
                className="h-7 px-3 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
              >
                <MessageSquareIcon className="size-3.5 mr-1.5 text-[#38bdf8]" />
                Pastoral y Consultas
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Selector de tiempo */}
          <ToggleGroup
            multiple={false}
            value={timeRange ? [timeRange] : []}
            onValueChange={(val) => {
              if (val?.[0]) setTimeRange(val[0])
            }}
            variant="outline"
            className="hidden sm:flex"
          >
            <ToggleGroupItem value="90d" className="h-8 px-2.5 text-xs">
              3 meses
            </ToggleGroupItem>
            <ToggleGroupItem value="30d" className="h-8 px-2.5 text-xs">
              30 días
            </ToggleGroupItem>
            <ToggleGroupItem value="7d" className="h-8 px-2.5 text-xs">
              7 días
            </ToggleGroupItem>
          </ToggleGroup>

          <Select
            items={[
              { value: "90d", label: "3 meses" },
              { value: "30d", label: "30 días" },
              { value: "7d", label: "7 días" },
            ]}
            value={timeRange}
            onValueChange={(val) => {
              if (val) setTimeRange(val)
            }}
          >
            <SelectTrigger
              className="flex w-28 h-8 text-xs sm:hidden"
              size="sm"
            >
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="90d">3 meses</SelectItem>
              <SelectItem value="30d">30 días</SelectItem>
              <SelectItem value="7d">7 días</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent className="pt-4 pb-4">
        <div className="h-[280px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
            <AreaChart
              data={filteredData}
              margin={{ top: 10, right: 10, left: isDonaciones ? 15 : -10, bottom: 0 }}
            >
              <defs>
                {/* Gradiente Dorado Litúrgico */}
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C9A96A" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#C9A96A" stopOpacity={0.0} />
                </linearGradient>
                {/* Gradiente Celeste Mariano */}
                <linearGradient id="skyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                </linearGradient>
                {/* Gradiente Púrpura Intenciones */}
                <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="stroke-muted-foreground/15"
              />

              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                stroke="currentColor"
                className="text-[11px] fill-muted-foreground"
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("es-UY", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                stroke="currentColor"
                className="text-[11px] fill-muted-foreground"
                tickFormatter={(val) => {
                  if (isDonaciones) {
                    return val >= 1000 ? `$${Math.round(val / 1000)}k` : `$${val}`
                  }
                  return val
                }}
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null
                  const dateStr = new Date(label).toLocaleDateString("es-UY", {
                    weekday: "short",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })

                  return (
                    <div className="rounded-lg border border-border/80 bg-background/95 p-3 shadow-xl backdrop-blur-md text-xs space-y-1.5 min-w-[170px]">
                      <p className="font-semibold text-foreground capitalize">{dateStr}</p>
                      <div className="border-t border-border/50 pt-1.5 space-y-1">
                        {isDonaciones ? (
                          <div className="flex items-center justify-between gap-3 text-[#C9A96A]">
                            <span className="flex items-center gap-1.5">
                              <span className="size-2 rounded-full bg-[#C9A96A]" />
                              Donaciones:
                            </span>
                            <span className="font-bold tabular-nums">
                              {formatCurrency(payload[0]?.value as number)}
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between gap-3 text-[#38bdf8]">
                              <span className="flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-[#38bdf8]" />
                                Consultas:
                              </span>
                              <span className="font-bold tabular-nums">
                                {payload[0]?.value}
                              </span>
                            </div>
                            {payload[1] && (
                              <div className="flex items-center justify-between gap-3 text-[#a855f7]">
                                <span className="flex items-center gap-1.5">
                                  <span className="size-2 rounded-full bg-[#a855f7]" />
                                  Intenciones:
                                </span>
                                <span className="font-bold tabular-nums">
                                  {payload[1]?.value}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )
                }}
              />

              {isDonaciones ? (
                <Area
                  type="monotone"
                  dataKey="donaciones"
                  name="Donaciones"
                  stroke="#C9A96A"
                  strokeWidth={2.5}
                  fill="url(#goldGradient)"
                  activeDot={{ r: 5, fill: "#C9A96A", stroke: "var(--background)", strokeWidth: 2 }}
                />
              ) : (
                <>
                  <Area
                    type="monotone"
                    dataKey="consultas"
                    name="Consultas"
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    fill="url(#skyGradient)"
                    activeDot={{ r: 5, fill: "#38bdf8", stroke: "var(--background)", strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="intenciones"
                    name="Intenciones"
                    stroke="#a855f7"
                    strokeWidth={2}
                    fill="url(#purpleGradient)"
                    activeDot={{ r: 4, fill: "#a855f7", stroke: "var(--background)", strokeWidth: 2 }}
                  />
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
