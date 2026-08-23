import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card>
        <CardHeader>
          <CardDescription>Mensajes Nuevos</CardDescription>
          <CardTitle className="text-2xl font-medium tabular-nums">
            12
          </CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Avisos Publicados</CardDescription>
          <CardTitle className="text-2xl font-medium tabular-nums">
            8
          </CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Próximas Misas</CardDescription>
          <CardTitle className="text-2xl font-medium tabular-nums">
            24
          </CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Fotos en Galería</CardDescription>
          <CardTitle className="text-2xl font-medium tabular-nums">
            156
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}
