"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
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

const chartData = [
  { date: "2024-04-01", misas: 8, mensajes: 3 },
  { date: "2024-04-07", misas: 8, mensajes: 5 },
  { date: "2024-04-14", misas: 9, mensajes: 2 },
  { date: "2024-04-21", misas: 8, mensajes: 7 },
  { date: "2024-04-28", misas: 10, mensajes: 4 },
  { date: "2024-05-05", misas: 8, mensajes: 6 },
  { date: "2024-05-12", misas: 9, mensajes: 3 },
  { date: "2024-05-19", misas: 8, mensajes: 8 },
  { date: "2024-05-26", misas: 10, mensajes: 5 },
  { date: "2024-06-02", misas: 8, mensajes: 4 },
  { date: "2024-06-09", misas: 9, mensajes: 6 },
  { date: "2024-06-16", misas: 8, mensajes: 9 },
  { date: "2024-06-23", misas: 10, mensajes: 7 },
  { date: "2024-06-30", misas: 8, mensajes: 5 },
]

const chartConfig = {
  visitors: { label: "Actividad" },
  misas: { label: "Misas", color: "var(--primary)" },
  mensajes: { label: "Mensajes", color: "var(--primary)" },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) setTimeRange("7d")
  }, [isMobile])

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2024-06-30")
    let daysToSubtract = 90
    if (timeRange === "30d") daysToSubtract = 30
    else if (timeRange === "7d") daysToSubtract = 7
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Actividad de la Parroquia</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Misas celebradas y mensajes recibidos
          </span>
          <span className="@[540px]/card:hidden">Últimos meses</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            multiple={false}
            value={timeRange ? [timeRange] : []}
            onValueChange={(value) => {
              setTimeRange(value[0] ?? "90d")
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Últimos 3 meses</ToggleGroupItem>
            <ToggleGroupItem value="30d">Últimos 30 días</ToggleGroupItem>
            <ToggleGroupItem value="7d">Últimos 7 días</ToggleGroupItem>
          </ToggleGroup>
          <Select
            value={timeRange}
            onValueChange={(value) => {
              if (value !== null) setTimeRange(value)
            }}
          >
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Seleccionar período"
            >
              <SelectValue placeholder="Últimos 3 meses" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="90d" className="rounded-md">Últimos 3 meses</SelectItem>
              <SelectItem value="30d" className="rounded-md">Últimos 30 días</SelectItem>
              <SelectItem value="7d" className="rounded-md">Últimos 7 días</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillMisas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-misas)" stopOpacity={1.0} />
                <stop offset="95%" stopColor="var(--color-misas)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillMensajes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-mensajes)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-mensajes)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("es-ES", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("es-ES", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="mensajes"
              type="natural"
              fill="url(#fillMensajes)"
              stroke="var(--color-mensajes)"
              stackId="a"
            />
            <Area
              dataKey="misas"
              type="natural"
              fill="url(#fillMisas)"
              stroke="var(--color-misas)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
