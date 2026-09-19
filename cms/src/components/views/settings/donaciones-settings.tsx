"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import {
  getLocalConfig,
  fetchSiteConfigFromDb,
  saveFullSiteConfig,
  type SiteConfig,
  type CuentaBancariaItem,
  type MedioDonacionItem,
} from "@/lib/config"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  CheckIcon,
  PlusIcon,
  Edit3Icon,
  Trash2Icon,
} from "lucide-react"

export function DonacionesSettings() {
  const [config, setConfig] = React.useState<SiteConfig>(getLocalConfig())
  const [saving, setSaving] = React.useState(false)
  const [savedSuccess, setSavedSuccess] = React.useState(false)
  const [showMpToken, setShowMpToken] = React.useState(false)

  // Diálogos de Cuentas Bancarias
  const [isCuentaDialogOpen, setIsCuentaDialogOpen] = React.useState(false)
  const [editingCuenta, setEditingCuenta] = React.useState<CuentaBancariaItem | null>(null)
  const [cuentaBanco, setCuentaBanco] = React.useState("")
  const [cuentaTitular, setCuentaTitular] = React.useState("")
  const [cuentaTipo, setCuentaTipo] = React.useState("")
  const [cuentaNumero, setCuentaNumero] = React.useState("")
  const [cuentaIdFiscal, setCuentaIdFiscal] = React.useState("")
  const [cuentaRef, setCuentaRef] = React.useState("")

  // Diálogos de Medios de Donación
  const [isMedioDialogOpen, setIsMedioDialogOpen] = React.useState(false)
  const [editingMedio, setEditingMedio] = React.useState<MedioDonacionItem | null>(null)
  const [medioTitulo, setMedioTitulo] = React.useState("")
  const [medioDescripcion, setMedioDescripcion] = React.useState("")
  const [medioEnlace, setMedioEnlace] = React.useState("")
  const [medioEtiqueta, setMedioEtiqueta] = React.useState("")

  React.useEffect(() => {
    fetchSiteConfigFromDb().then((dbConfig) => {
      if (dbConfig) setConfig(dbConfig)
    })
  }, [])

  const updateSection = (section: keyof SiteConfig, key: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [key]: value,
      },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveFullSiteConfig(config)
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  // Cuentas Bancarias Handlers
  const handleOpenNewCuenta = () => {
    setEditingCuenta(null)
    setCuentaBanco("")
    setCuentaTitular("")
    setCuentaTipo("Caja de Ahorro en Pesos (UYU)")
    setCuentaNumero("")
    setCuentaIdFiscal("")
    setCuentaRef("")
    setIsCuentaDialogOpen(true)
  }

  const handleOpenEditCuenta = (c: CuentaBancariaItem) => {
    setEditingCuenta(c)
    setCuentaBanco(c.banco)
    setCuentaTitular(c.titular)
    setCuentaTipo(c.tipo_cuenta)
    setCuentaNumero(c.numero_cuenta)
    setCuentaIdFiscal(c.identificacion_fiscal || "")
    setCuentaRef(c.referencia || "")
    setIsCuentaDialogOpen(true)
  }

  const handleSaveCuenta = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cuentaBanco.trim() || !cuentaNumero.trim()) return

    const currentList = config.donaciones?.cuentas_bancarias || []
    if (editingCuenta) {
      const updated = currentList.map((c) =>
        c.id === editingCuenta.id
          ? {
              ...c,
              banco: cuentaBanco.trim(),
              titular: cuentaTitular.trim(),
              tipo_cuenta: cuentaTipo.trim(),
              numero_cuenta: cuentaNumero.trim(),
              identificacion_fiscal: cuentaIdFiscal.trim() || undefined,
              referencia: cuentaRef.trim() || undefined,
            }
          : c
      )
      updateSection("donaciones", "cuentas_bancarias", updated)
    } else {
      const nueva: CuentaBancariaItem = {
        id: `cta-${Date.now()}`,
        banco: cuentaBanco.trim(),
        titular: cuentaTitular.trim(),
        tipo_cuenta: cuentaTipo.trim(),
        numero_cuenta: cuentaNumero.trim(),
        identificacion_fiscal: cuentaIdFiscal.trim() || undefined,
        referencia: cuentaRef.trim() || undefined,
        activo: true,
      }
      updateSection("donaciones", "cuentas_bancarias", [...currentList, nueva])
    }
    setIsCuentaDialogOpen(false)
  }

  const handleDeleteCuenta = (id: string) => {
    const currentList = config.donaciones?.cuentas_bancarias || []
    updateSection(
      "donaciones",
      "cuentas_bancarias",
      currentList.filter((c) => c.id !== id)
    )
  }

  // Medios de Donación Handlers
  const handleOpenNewMedio = () => {
    setEditingMedio(null)
    setMedioTitulo("")
    setMedioDescripcion("")
    setMedioEnlace("")
    setMedioEtiqueta("")
    setIsMedioDialogOpen(true)
  }

  const handleOpenEditMedio = (m: MedioDonacionItem) => {
    setEditingMedio(m)
    setMedioTitulo(m.titulo)
    setMedioDescripcion(m.descripcion)
    setMedioEnlace(m.enlace || "")
    setMedioEtiqueta(m.etiqueta_boton || "")
    setIsMedioDialogOpen(true)
  }

  const handleSaveMedio = (e: React.FormEvent) => {
    e.preventDefault()
    if (!medioTitulo.trim()) return

    const currentList = config.donaciones?.medios_donacion || []
    if (editingMedio) {
      const updated = currentList.map((m) =>
        m.id === editingMedio.id
          ? {
              ...m,
              titulo: medioTitulo.trim(),
              descripcion: medioDescripcion.trim(),
              enlace: medioEnlace.trim() || undefined,
              etiqueta_boton: medioEtiqueta.trim() || undefined,
            }
          : m
      )
      updateSection("donaciones", "medios_donacion", updated)
    } else {
      const nuevo: MedioDonacionItem = {
        id: `md-${Date.now()}`,
        titulo: medioTitulo.trim(),
        descripcion: medioDescripcion.trim(),
        enlace: medioEnlace.trim() || undefined,
        etiqueta_boton: medioEtiqueta.trim() || undefined,
        activo: true,
      }
      updateSection("donaciones", "medios_donacion", [...currentList, nuevo])
    }
    setIsMedioDialogOpen(false)
  }

  const handleDeleteMedio = (id: string) => {
    const currentList = config.donaciones?.medios_donacion || []
    updateSection(
      "donaciones",
      "medios_donacion",
      currentList.filter((m) => m.id !== id)
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0 w-full overflow-hidden">
      {/* Static Header */}
      <div className="w-full px-6 py-4 border-b border-border bg-background shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-medium tracking-tight text-foreground">
            Ajustes de Donaciones y Sostenimiento
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configuración de credenciales de Mercado Pago Uruguay, cuentas bancarias y medios de colaboración.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {savedSuccess && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Guardado
            </span>
          )}
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="gap-1.5 cursor-pointer"
          >
            {saving ? (
              "Guardando..."
            ) : (
              <>
                <CheckIcon className="size-4" />
                Guardar cambios
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        {/* Mercado Pago Uruguay */}
        <Card className="p-0 border-primary/20 shadow-xs">
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Mercado Pago Uruguay</h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                    Payment Bricks & Suscripciones
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Permite recibir donaciones en línea con tarjetas locales (Visa, Mastercard, OCA, Líder) y efectivo (Abitab, Redpagos).
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Switch
                  id="mp-activo-switch"
                  checked={config.donaciones?.mercadopago?.activo ?? true}
                  onCheckedChange={(checked) => {
                    const mp = config.donaciones?.mercadopago || {
                      activo: true,
                      modo: "sandbox",
                      public_key: "",
                      access_token: "",
                    }
                    updateSection("donaciones", "mercadopago", {
                      ...mp,
                      activo: checked,
                    })
                  }}
                />
                <Label htmlFor="mp-activo-switch" className="text-xs font-semibold cursor-pointer">
                  Habilitar en la web
                </Label>
              </div>
            </div>

            <div className="grid gap-4 pt-1">
              {/* Selector de Modo */}
              <div className="grid gap-1.5">
                <Label className="text-xs">Ambiente de Operación</Label>
                <div className="flex items-center gap-5 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="mp_settings_modo"
                      value="sandbox"
                      checked={(config.donaciones?.mercadopago?.modo || "sandbox") === "sandbox"}
                      onChange={() => {
                        const mp = config.donaciones?.mercadopago || {
                          activo: true,
                          modo: "sandbox",
                          public_key: "",
                          access_token: "",
                        }
                        updateSection("donaciones", "mercadopago", { ...mp, modo: "sandbox" })
                      }}
                      className="cursor-pointer"
                    />
                    <span>Pruebas (Sandbox)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="mp_settings_modo"
                      value="produccion"
                      checked={config.donaciones?.mercadopago?.modo === "produccion"}
                      onChange={() => {
                        const mp = config.donaciones?.mercadopago || {
                          activo: true,
                          modo: "sandbox",
                          public_key: "",
                          access_token: "",
                        }
                        updateSection("donaciones", "mercadopago", { ...mp, modo: "produccion" })
                      }}
                      className="cursor-pointer"
                    />
                    <span>Producción (Cobros reales)</span>
                  </label>
                </div>
              </div>

              {/* Public Key */}
              <div className="grid gap-1.5">
                <Label className="text-xs">Clave Pública (Public Key - Frontend)</Label>
                <Input
                  value={config.donaciones?.mercadopago?.public_key || ""}
                  onChange={(e) => {
                    const mp = config.donaciones?.mercadopago || {
                      activo: true,
                      modo: "sandbox",
                      public_key: "",
                      access_token: "",
                    }
                    updateSection("donaciones", "mercadopago", { ...mp, public_key: e.target.value.trim() })
                  }}
                  placeholder="APP_USR-xxxx-xxxx-xxxx-xxxx"
                  className="text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Se utiliza para renderizar el formulario seguro de Payment Bricks en el navegador.
                </p>
              </div>

              {/* Access Token */}
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Token de Acceso Privado (Access Token - Backend)</Label>
                  <button
                    type="button"
                    onClick={() => setShowMpToken(!showMpToken)}
                    className="text-[11px] text-primary hover:underline cursor-pointer"
                  >
                    {showMpToken ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                <Input
                  type={showMpToken ? "text" : "password"}
                  value={config.donaciones?.mercadopago?.access_token || ""}
                  onChange={(e) => {
                    const mp = config.donaciones?.mercadopago || {
                      activo: true,
                      modo: "sandbox",
                      public_key: "",
                      access_token: "",
                    }
                    updateSection("donaciones", "mercadopago", { ...mp, access_token: e.target.value.trim() })
                  }}
                  placeholder="APP_USR-xxxx..."
                  className="text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Clave privada protegida para autorizar las transacciones en el servidor.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cuentas bancarias */}
        <Card className="p-0">
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Cuentas bancarias para transferencias</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cuentas oficiales para que los fieles puedan realizar transferencias y depósitos bancarios directos.
                </p>
              </div>
              <Button type="button" size="sm" onClick={handleOpenNewCuenta} className="gap-1.5 text-xs cursor-pointer">
                <PlusIcon className="size-3.5" />
                Agregar Cuenta Bancaria
              </Button>
            </div>

            {(config.donaciones?.cuentas_bancarias || []).length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground border rounded-lg bg-muted/20">
                No hay cuentas bancarias cargadas. Hacé clic en "Agregar Cuenta Bancaria" para añadir una.
              </div>
            ) : (
              <div className="border rounded-lg overflow-x-auto w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="px-4">Banco / Institución</TableHead>
                      <TableHead className="px-4">Tipo / Moneda</TableHead>
                      <TableHead className="px-4">N.º de Cuenta</TableHead>
                      <TableHead className="px-4 hidden sm:table-cell">Titular</TableHead>
                      <TableHead className="px-4 hidden md:table-cell">Documento / RUT</TableHead>
                      <TableHead className="text-right px-4"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(config.donaciones?.cuentas_bancarias || []).map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="px-4 py-3 font-medium text-sm">{c.banco}</TableCell>
                        <TableCell className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{c.tipo_cuenta}</TableCell>
                        <TableCell className="px-4 py-3 text-xs font-medium whitespace-nowrap">{c.numero_cuenta}</TableCell>
                        <TableCell className="px-4 py-3 hidden sm:table-cell text-xs text-muted-foreground">{c.titular}</TableCell>
                        <TableCell className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground whitespace-nowrap">{c.identificacion_fiscal || "—"}</TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
                              onClick={() => handleOpenEditCuenta(c)}
                              title="Editar"
                            >
                              <Edit3Icon className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                              onClick={() => handleDeleteCuenta(c.id)}
                              title="Eliminar"
                            >
                              <Trash2Icon className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Otros Medios de donación */}
        <Card className="p-0">
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Otros medios y colectas</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Alternativas adicionales para colaborar (alcancías en templo, colectas especiales, secretaría).
                </p>
              </div>
              <Button type="button" size="sm" onClick={handleOpenNewMedio} className="gap-1.5 text-xs cursor-pointer">
                <PlusIcon className="size-3.5" />
                Agregar Medio
              </Button>
            </div>

            {(config.donaciones?.medios_donacion || []).length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground border rounded-lg bg-muted/20">
                No hay otros medios de donación configurados.
              </div>
            ) : (
              <div className="border rounded-lg overflow-x-auto w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="px-4">Medio / Título</TableHead>
                      <TableHead className="px-4">Descripción</TableHead>
                      <TableHead className="px-4 hidden sm:table-cell">Enlace / Botón</TableHead>
                      <TableHead className="text-right px-4"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(config.donaciones?.medios_donacion || []).map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="px-4 py-3 font-medium text-sm whitespace-nowrap">{m.titulo}</TableCell>
                        <TableCell className="px-4 py-3 text-xs text-muted-foreground max-w-md truncate">{m.descripcion}</TableCell>
                        <TableCell className="px-4 py-3 hidden sm:table-cell text-xs text-muted-foreground whitespace-nowrap">
                          {m.enlace ? (
                            <a href={m.enlace} target="_blank" rel="noopener" className="text-primary underline">
                              {m.etiqueta_boton || "Donar"}
                            </a>
                          ) : (
                            "Presencial / Secretaría"
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
                              onClick={() => handleOpenEditMedio(m)}
                              title="Editar"
                            >
                              <Edit3Icon className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                              onClick={() => handleDeleteMedio(m.id)}
                              title="Eliminar"
                            >
                              <Trash2Icon className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mensaje de sostenimiento */}
        <Card className="p-0">
          <CardContent className="p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Mensaje y sostenimiento parroquial</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Encabezado e información pastoral general que acompaña a la sección de colaboraciones.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <Label className="text-xs">Título de la sección</Label>
                <Input
                  value={config.donaciones?.titulo_seccion || ""}
                  onChange={(e) => updateSection("donaciones", "titulo_seccion", e.target.value)}
                  placeholder="Ej: Colaborar con la parroquia"
                />
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">Mensaje para la comunidad</Label>
                <Textarea
                  rows={2}
                  value={config.donaciones?.mensaje || ""}
                  onChange={(e) => updateSection("donaciones", "mensaje", e.target.value)}
                  placeholder="Breve mensaje explicativo del destino de las colaboraciones y sostenimiento del templo..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Diálogo: Cuenta Bancaria ─── */}
      <Dialog open={isCuentaDialogOpen} onOpenChange={setIsCuentaDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[480px] max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleSaveCuenta}>
            <DialogHeader>
              <DialogTitle>
                {editingCuenta ? "Editar Cuenta Bancaria" : "Nueva Cuenta Bancaria"}
              </DialogTitle>
              <DialogDescription>
                Ingresá los datos de la cuenta oficial para que los fieles puedan realizar transferencias.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4">
              <div className="grid gap-1.5">
                <Label htmlFor="s-cuenta-banco" className="text-xs">Banco / Institución *</Label>
                <Input
                  id="s-cuenta-banco"
                  value={cuentaBanco}
                  onChange={(e) => setCuentaBanco(e.target.value)}
                  placeholder="Ej: Banco República (BROU), Santander, BBVA..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="s-cuenta-tipo" className="text-xs">Tipo de Cuenta y Moneda *</Label>
                  <Input
                    id="s-cuenta-tipo"
                    value={cuentaTipo}
                    onChange={(e) => setCuentaTipo(e.target.value)}
                    placeholder="Ej: Caja de Ahorro en Pesos (UYU)"
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="s-cuenta-numero" className="text-xs">Número de Cuenta *</Label>
                  <Input
                    id="s-cuenta-numero"
                    value={cuentaNumero}
                    onChange={(e) => setCuentaNumero(e.target.value)}
                    placeholder="Ej: 001558899-00001"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="s-cuenta-titular" className="text-xs">Titular de la Cuenta</Label>
                  <Input
                    id="s-cuenta-titular"
                    value={cuentaTitular}
                    onChange={(e) => setCuentaTitular(e.target.value)}
                    placeholder="Ej: Parroquia Santa María de la Ayuda"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="s-cuenta-id" className="text-xs">RUT o Cédula</Label>
                  <Input
                    id="s-cuenta-id"
                    value={cuentaIdFiscal}
                    onChange={(e) => setCuentaIdFiscal(e.target.value)}
                    placeholder="Ej: 21.123.456.0018"
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="s-cuenta-ref" className="text-xs">Referencia o Instrucción (opcional)</Label>
                <Input
                  id="s-cuenta-ref"
                  value={cuentaRef}
                  onChange={(e) => setCuentaRef(e.target.value)}
                  placeholder="Ej: Indicar apellido en el concepto de la transferencia"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCuentaDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingCuenta ? "Guardar Cambios" : "Agregar Cuenta"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Diálogo: Medio de Donación ─── */}
      <Dialog open={isMedioDialogOpen} onOpenChange={setIsMedioDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[480px] max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleSaveMedio}>
            <DialogHeader>
              <DialogTitle>
                {editingMedio ? "Editar Medio de Donación" : "Nuevo Medio de Donación"}
              </DialogTitle>
              <DialogDescription>
                Añadí otras opciones para que los fieles puedan colaborar (colectas, bonos, alcancías, etc.).
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4">
              <div className="grid gap-1.5">
                <Label htmlFor="s-medio-titulo" className="text-xs">Título o Medio *</Label>
                <Input
                  id="s-medio-titulo"
                  value={medioTitulo}
                  onChange={(e) => setMedioTitulo(e.target.value)}
                  placeholder="Ej: Colecta en Celebraciones, Socio Mensual..."
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="s-medio-desc" className="text-xs">Descripción</Label>
                <Textarea
                  id="s-medio-desc"
                  rows={2}
                  value={medioDescripcion}
                  onChange={(e) => setMedioDescripcion(e.target.value)}
                  placeholder="Indicaciones para realizar el aporte..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="s-medio-enlace" className="text-xs">Enlace web (opcional)</Label>
                  <Input
                    id="s-medio-enlace"
                    value={medioEnlace}
                    onChange={(e) => setMedioEnlace(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="s-medio-btn" className="text-xs">Texto del Botón (opcional)</Label>
                  <Input
                    id="s-medio-btn"
                    value={medioEtiqueta}
                    onChange={(e) => setMedioEtiqueta(e.target.value)}
                    placeholder="Ej: Más información"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsMedioDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingMedio ? "Guardar Cambios" : "Agregar Medio"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
