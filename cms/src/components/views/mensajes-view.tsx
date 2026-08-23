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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  MailIcon,
  CheckCircle2Icon,
  ReplyIcon,
  PhoneIcon,
  UserIcon,
  Trash2Icon,
  DownloadIcon,
  EllipsisVerticalIcon,
} from "lucide-react"
import { getMensajes, updateMensaje, deleteMensaje, type MensajeItem } from "@/lib/data-store"

export function MensajesView() {
  const [mensajes, setMensajes] = React.useState<MensajeItem[]>([])
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedMessage, setSelectedMessage] = React.useState<MensajeItem | null>(null)

  const refresh = React.useCallback(() => {
    setMensajes(getMensajes())
  }, [])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  const filtered = mensajes.filter((m) =>
    m.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.correo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.motivo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.mensaje?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleToggleRespondido = (id: string) => {
    const target = mensajes.find((m) => m.id === id)
    if (!target) return
    const nextState = !target.respondido
    updateMensaje(id, { respondido: nextState, leido: true })
    setMensajes((prev) => prev.map((m) => m.id === id ? { ...m, respondido: nextState, leido: true } : m))
    if (selectedMessage?.id === id) {
      setSelectedMessage((prev) => prev ? { ...prev, respondido: nextState, leido: true } : null)
    }
  }

  const handleDelete = (id: string) => {
    deleteMensaje(id)
    setMensajes((prev) => prev.filter((m) => m.id !== id))
    if (selectedMessage?.id === id) setSelectedMessage(null)
  }

  const handleExport = () => {
    const csv = mensajes.map((m) => `"${m.nombre}","${m.correo}","${m.motivo}","${m.created_at || ""}"`).join("\n")
    const blob = new Blob(["Nombre,Correo,Motivo,Fecha\n" + csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "mensajes.csv"
    a.click()
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 lg:px-6">
        <div className="relative w-full sm:w-80">
          <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar mensajes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5 cursor-pointer">
          <DownloadIcon className="size-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Table Card */}
      <div className="px-4 lg:px-6">
        <Card className="p-0">
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No se encontraron mensajes.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="px-4">Remitente</TableHead>
                    <TableHead className="px-4">Motivo</TableHead>
                    <TableHead className="px-4 hidden md:table-cell">Mensaje</TableHead>
                    <TableHead className="px-4 hidden sm:table-cell">Fecha</TableHead>
                    <TableHead className="px-4">Estado</TableHead>
                    <TableHead className="text-right px-4"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((m) => (
                    <TableRow
                      key={m.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedMessage(m)}
                    >
                      <TableCell className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{m.nombre}</span>
                          <span className="text-xs text-muted-foreground">{m.correo}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm">{m.motivo}</TableCell>
                      <TableCell className="px-4 py-3 hidden md:table-cell text-sm text-muted-foreground max-w-xs truncate">
                        {m.mensaje}
                      </TableCell>
                      <TableCell className="px-4 py-3 hidden sm:table-cell text-sm text-muted-foreground whitespace-nowrap">
                        {m.created_at || "Reciente"}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {m.respondido ? (
                          <Badge variant="outline" className="gap-1.5 text-emerald-600 border-emerald-300">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Atendido
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1.5">
                            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pendiente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground data-open:bg-muted cursor-pointer" />
                            }
                          >
                            <EllipsisVerticalIcon className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem className="cursor-pointer" onClick={() => setSelectedMessage(m)}>
                              <MailIcon />
                              Ver detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => window.open(`mailto:${m.correo}?subject=Parroquia Santa María de la Ayuda: ${m.motivo}`)}>
                              <ReplyIcon />
                              Responder por correo
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => handleToggleRespondido(m.id)}>
                              <CheckCircle2Icon />
                              {m.respondido ? "Marcar pendiente" : "Marcar atendido"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" className="cursor-pointer" onClick={() => handleDelete(m.id)}>
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

      {/* Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        {selectedMessage && (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalle de Consulta</DialogTitle>
              <DialogDescription>Información enviada a través de la web pública.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-3 text-sm">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-md bg-muted/40 border">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Contacto</span>
                  <span className="font-medium flex items-center gap-1.5 mt-0.5">
                    <UserIcon className="size-3.5 text-muted-foreground" />
                    {selectedMessage.nombre}
                  </span>
                  <span className="text-xs text-muted-foreground">{selectedMessage.correo}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Motivo</span>
                  <span className="font-medium mt-0.5">{selectedMessage.motivo}</span>
                  {selectedMessage.telefono && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <PhoneIcon className="size-3" />
                      {selectedMessage.telefono}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground">Mensaje</span>
                <div className="p-3 rounded-md bg-background border leading-relaxed text-sm">
                  {selectedMessage.mensaje}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Estado: <strong>{selectedMessage.respondido ? "Atendido" : "Pendiente"}</strong>
                </span>
                <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer" onClick={() => handleToggleRespondido(selectedMessage.id)}>
                  <CheckCircle2Icon className={`size-3.5 ${selectedMessage.respondido ? "text-emerald-500" : "text-muted-foreground"}`} />
                  {selectedMessage.respondido ? "Marcar pendiente" : "Marcar atendido"}
                </Button>
              </div>
            </div>
            <DialogFooter className="border-t pt-3">
              <Button variant="outline" size="sm" onClick={() => setSelectedMessage(null)} className="cursor-pointer">Cerrar</Button>
              <a
                href={`mailto:${selectedMessage.correo}?subject=Respuesta Parroquia Santa María de la Ayuda: ${selectedMessage.motivo}`}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <ReplyIcon className="size-3.5" />
                Responder por Email
              </a>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
