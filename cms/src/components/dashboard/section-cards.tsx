import * as React from "react"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  getMensajes,
  fetchMensajesFromDb,
  getAvisos,
  fetchAvisosFromDb,
  getHorarios,
  fetchHorariosFromDb,
  getFotos,
  fetchFotosFromDb,
} from "@/lib/data-store"

export function SectionCards() {
  const [stats, setStats] = React.useState({
    mensajesPendientes: 0,
    avisosActivos: 0,
    horariosTotal: 0,
    fotosTotal: 0,
  })

  React.useEffect(() => {
    // Initial stats from local cache
    const m = getMensajes()
    const a = getAvisos()
    const h = getHorarios()
    const f = getFotos()
    setStats({
      mensajesPendientes: m.filter((x) => !x.respondido || !x.leido).length,
      avisosActivos: a.filter((x) => x.activo).length,
      horariosTotal: h.filter((x) => x.activo).length,
      fotosTotal: f.filter((x) => x.activo).length,
    })

    // Fetch from live database
    Promise.all([
      fetchMensajesFromDb(),
      fetchAvisosFromDb(),
      fetchHorariosFromDb(),
      fetchFotosFromDb(),
    ]).then(([liveM, liveA, liveH, liveF]) => {
      setStats({
        mensajesPendientes: (liveM || []).filter((x) => !x.respondido || !x.leido).length,
        avisosActivos: (liveA || []).filter((x) => x.activo).length,
        horariosTotal: (liveH || []).filter((x) => x.activo).length,
        fotosTotal: (liveF || []).filter((x) => x.activo).length,
      })
    })
  }, [])

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card>
        <CardHeader>
          <CardDescription>Mensajes Pendientes</CardDescription>
          <CardTitle className="text-2xl font-medium tabular-nums">
            {stats.mensajesPendientes}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Avisos Publicados</CardDescription>
          <CardTitle className="text-2xl font-medium tabular-nums">
            {stats.avisosActivos}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Horarios y Celebraciones</CardDescription>
          <CardTitle className="text-2xl font-medium tabular-nums">
            {stats.horariosTotal}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Fotos en Galería</CardDescription>
          <CardTitle className="text-2xl font-medium tabular-nums">
            {stats.fotosTotal}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}
