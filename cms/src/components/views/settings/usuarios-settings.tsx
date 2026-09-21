"use client"

import * as React from "react"
import {
  getUsers,
  fetchUsersFromDb,
  fetchResetTokensFromDb,
  addUserAsync,
  updateUser,
  deleteUser,
  changeUserPassword,
  createOrRenewInvitation,
  getUserInviteStatus,
  getSession,
  type CMSUser,
  type PasswordResetRecord,
} from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  PlusIcon,
  SearchIcon,
  EllipsisVerticalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  KeyRoundIcon,
  MailIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  CopyIcon,
  ClockIcon,
  SendIcon,
  RefreshCwIcon,
  CheckIcon,
} from "lucide-react"
import { sendWelcomeEmail } from "@/lib/email"

const ROLES: { value: CMSUser["rol"]; label: string; desc: string }[] = [
  { value: "admin", label: "Administrador", desc: "Acceso completo a todo el panel" },
  { value: "editor", label: "Editor", desc: "Puede crear y editar contenido" },
  { value: "viewer", label: "Solo lectura", desc: "Solo puede ver el contenido" },
]

function formatInviteExpiration(expiresAt: number): string {
  const diffMs = expiresAt - Date.now()
  if (diffMs <= 0) return "Venció"
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 24) {
    return diffHours <= 1 ? "Expira en 1 hora" : `Expira en ${diffHours} h`
  }
  const diffDays = Math.ceil(diffHours / 24)
  return diffDays === 1 ? "Expira mañana" : `Expira en ${diffDays} días`
}

export function UsuariosSettings() {
  const [users, setUsers] = React.useState<CMSUser[]>([])
  const [tokens, setTokens] = React.useState<PasswordResetRecord[]>([])
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")

  // Async action states
  const [resendingUserId, setResendingUserId] = React.useState<string | null>(null)
  const [copiedUserId, setCopiedUserId] = React.useState<string | null>(null)

  // Modals
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<CMSUser | null>(null)

  // Add form
  const [addNombre, setAddNombre] = React.useState("")
  const [addEmail, setAddEmail] = React.useState("")
  const [addRol, setAddRol] = React.useState<CMSUser["rol"]>("editor")
  const [addError, setAddError] = React.useState("")
  const [sendWelcome, setSendWelcome] = React.useState(true)
  const [isSubmittingAdd, setIsSubmittingAdd] = React.useState(false)

  // Status feedback toast/banner
  const [actionFeedback, setActionFeedback] = React.useState<{ ok: boolean; msg: string; link?: string } | null>(null)

  // Edit form
  const [editNombre, setEditNombre] = React.useState("")
  const [editEmail, setEditEmail] = React.useState("")
  const [editRol, setEditRol] = React.useState<CMSUser["rol"]>("editor")
  const [editStatus, setEditStatus] = React.useState<CMSUser["status"]>("activo")

  // Password form
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [passwordError, setPasswordError] = React.useState("")

  // Pagination
  const [pageIndex, setPageIndex] = React.useState(0)
  const pageSize = 10

  const refresh = React.useCallback(async () => {
    try {
      const [uData, tData] = await Promise.all([
        fetchUsersFromDb().catch(() => getUsers()),
        fetchResetTokensFromDb().catch(() => []),
      ])
      setUsers(uData)
      setTokens(tData)
    } catch {
      setUsers(getUsers())
    }
  }, [])

  React.useEffect(() => {
    refresh()
    const session = getSession()
    if (session) setCurrentUserId(session.userId)
  }, [refresh])

  const filtered = React.useMemo(() =>
    users.filter(
      (u) =>
        u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [users, searchTerm]
  )

  const totalPages = Math.ceil(filtered.length / pageSize) || 1
  const currentPage = Math.min(pageIndex, totalPages - 1)
  const paginated = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize)

  const handleOpenAdd = () => {
    setAddNombre("")
    setAddEmail("")
    setAddRol("editor")
    setAddError("")
    setSendWelcome(true)
    setIsAddOpen(true)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError("")
    if (!addNombre.trim() || !addEmail.trim()) return

    const emailExists = users.some((u) => u.email.toLowerCase() === addEmail.toLowerCase())
    if (emailExists) {
      setAddError("Ya existe un usuario con ese correo")
      return
    }

    setIsSubmittingAdd(true)
    try {
      const nuevo = await addUserAsync({
        nombre: addNombre.trim(),
        email: addEmail.trim(),
        rol: addRol,
        status: "activo",
      })

      // Generar y persistir token de invitación seguro en Supabase
      const inv = await createOrRenewInvitation(nuevo.id, addEmail.trim())
      await refresh()

      if (sendWelcome) {
        const mailResult = await sendWelcomeEmail({
          to: addEmail.trim(),
          userName: addNombre.trim(),
          userRole: addRol,
          setupPasswordLink: inv.link,
        })

        if (mailResult.ok) {
          setActionFeedback({
            ok: true,
            msg: `Usuario "${addNombre.trim()}" creado y correo de invitación enviado a ${addEmail.trim()} para definir su contraseña.`,
            link: inv.link,
          })
        } else {
          setActionFeedback({
            ok: false,
            msg: `Usuario creado, pero hubo un error al enviar el email (${mailResult.error || "Error de Resend"}). Podés compartirle el enlace directo:`,
            link: inv.link,
          })
        }
      } else {
        setActionFeedback({
          ok: true,
          msg: `Usuario "${addNombre.trim()}" creado. Deberá configurar su contraseña al ingresar usando el siguiente enlace:`,
          link: inv.link,
        })
      }

      setIsAddOpen(false)
    } catch (err: any) {
      setAddError(err?.message || "Error al crear el usuario.")
    } finally {
      setIsSubmittingAdd(false)
    }
  }

  const handleResendInvitation = async (user: CMSUser) => {
    setResendingUserId(user.id)
    setActionFeedback(null)
    try {
      // 1. Generar o renovar token de 7 días persistido en Supabase
      const inv = await createOrRenewInvitation(user.id, user.email)
      await refresh()

      // 2. Enviar email usando la plantilla institucional base
      const mailResult = await sendWelcomeEmail({
        to: user.email,
        userName: user.nombre,
        userRole: user.rol,
        setupPasswordLink: inv.link,
      })

      if (mailResult.ok) {
        setActionFeedback({
          ok: true,
          msg: `Invitación reenviada con éxito a ${user.email}. El enlace nuevo es válido por 7 días.`,
          link: inv.link,
        })
      } else {
        setActionFeedback({
          ok: false,
          msg: `Se renovó el enlace de invitación para ${user.nombre}, pero falló el envío del correo (${mailResult.error || "Error de correo"}). Podés compartirle este enlace directo:`,
          link: inv.link,
        })
      }
    } catch (err: any) {
      setActionFeedback({
        ok: false,
        msg: `Error al reenviar invitación: ${err?.message || "Error desconocido"}`,
      })
    } finally {
      setResendingUserId(null)
    }
  }

  const handleCopyInviteLink = async (user: CMSUser) => {
    try {
      const invite = getUserInviteStatus(user, tokens)
      let linkToCopy = invite.link

      // Si no tiene invitación o está vencida, renovar
      if (!invite.hasInvite || invite.isExpired || !linkToCopy) {
        const inv = await createOrRenewInvitation(user.id, user.email)
        linkToCopy = inv.link
        await refresh()
      }

      await navigator.clipboard.writeText(linkToCopy)
      setCopiedUserId(user.id)
      setTimeout(() => setCopiedUserId(null), 2500)
      setActionFeedback({
        ok: true,
        msg: `Enlace copiado para ${user.nombre}. Podés enviárselo directamente por WhatsApp o chat.`,
        link: linkToCopy,
      })
    } catch {
      alert("No se pudo copiar el enlace al portapapeles.")
    }
  }

  const handleOpenEdit = (user: CMSUser) => {
    setEditingUser(user)
    setEditNombre(user.nombre)
    setEditEmail(user.email)
    setEditRol(user.rol)
    setEditStatus(user.status)
    setIsEditOpen(true)
  }

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser || !editNombre.trim()) return
    updateUser(editingUser.id, {
      nombre: editNombre.trim(),
      email: editEmail.trim(),
      rol: editRol,
      status: editStatus,
    })
    refresh()
    setIsEditOpen(false)
  }

  const handleOpenPassword = (user: CMSUser) => {
    setEditingUser(user)
    setNewPassword(""); setConfirmPassword(""); setPasswordError("")
    setIsPasswordOpen(true)
  }

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")
    if (newPassword.length < 6) { setPasswordError("Mínimo 6 caracteres"); return }
    if (newPassword !== confirmPassword) { setPasswordError("Las contraseñas no coinciden"); return }
    if (!editingUser) return
    changeUserPassword(editingUser.id, newPassword)
    setIsPasswordOpen(false)
  }

  const handleToggleStatus = (user: CMSUser) => {
    if (user.id === currentUserId) { alert("No podés desactivar tu propia cuenta"); return }
    updateUser(user.id, { status: user.status === "activo" ? "inactivo" : "activo" })
    refresh()
  }

  const handleDelete = (user: CMSUser) => {
    if (user.id === currentUserId) { alert("No podés eliminar tu propia cuenta"); return }
    if (confirm(`¿Eliminar a ${user.nombre}? Esta acción no se puede deshacer.`)) {
      deleteUser(user.id)
      refresh()
    }
  }

  const rolLabel = (rol: CMSUser["rol"]) => ROLES.find((r) => r.value === rol)?.label ?? rol

  return (
    <div className="flex flex-col h-full min-h-0 w-full overflow-hidden">
      {/* Static Header */}
      <div className="w-full px-6 py-4 border-b border-border bg-background shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-medium tracking-tight text-foreground">
            Usuarios del Panel
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gestioná quién tiene acceso al CMS y con qué permisos.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={handleOpenAdd} size="sm" className="gap-1.5 cursor-pointer">
            <PlusIcon className="size-4" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 pb-28 md:pb-6">
        {/* Action feedback banner */}
        {actionFeedback && (
          <div
            className={`p-3.5 rounded-lg border text-xs space-y-2 animate-in fade-in ${
              actionFeedback.ok
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                : "bg-destructive/10 border-destructive/20 text-destructive"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                {actionFeedback.ok ? (
                  <CheckCircle2Icon className="size-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircleIcon className="size-4 shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed">{actionFeedback.msg}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionFeedback(null)}
                className="text-xs opacity-60 hover:opacity-100 cursor-pointer ml-2 shrink-0"
              >
                ✕
              </button>
            </div>

            {actionFeedback.link && (
              <div className="pt-2 border-t border-current/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-mono text-[11px] truncate max-w-full sm:max-w-md opacity-90 select-all">
                  {actionFeedback.link}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] gap-1 shrink-0 self-start sm:self-auto cursor-pointer"
                  onClick={() => {
                    navigator.clipboard.writeText(actionFeedback.link!)
                    alert("Enlace copiado al portapapeles")
                  }}
                >
                  <CopyIcon className="size-3" />
                  Copiar enlace
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o correo..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPageIndex(0) }}
            />
          </div>
        </div>

        {/* Table Card */}
        <Card className="p-0 border rounded-lg overflow-hidden shadow-2xs">
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No hay usuarios registrados.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto w-full">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="px-4">Estado</TableHead>
                        <TableHead className="px-4">Usuario</TableHead>
                        <TableHead className="px-4 hidden sm:table-cell">Correo</TableHead>
                        <TableHead className="px-4">Rol</TableHead>
                        <TableHead className="px-4">Invitación / Acceso</TableHead>
                        <TableHead className="px-4 text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.map((user) => {
                        const invite = getUserInviteStatus(user, tokens)
                        const isResending = resendingUserId === user.id
                        const isCopied = copiedUserId === user.id

                        return (
                          <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="px-4 py-3">
                              {user.status === "activo" ? (
                                <Badge variant="outline" className="gap-1.5 text-emerald-600 border-emerald-300 dark:border-emerald-800">
                                  <span className="size-1.5 rounded-full bg-emerald-500" />
                                  Activo
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="gap-1.5 text-muted-foreground">
                                  <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                                  Inactivo
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="px-4 py-3 font-medium">
                              <div className="flex items-center gap-1.5">
                                <span>{user.nombre}</span>
                                {user.id === currentUserId && (
                                  <span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5 font-normal">Tú</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-muted-foreground hidden sm:table-cell text-xs">{user.email}</TableCell>
                            <TableCell className="px-4 py-3">
                              <Badge variant="secondary" className="text-xs font-normal">{rolLabel(user.rol)}</Badge>
                            </TableCell>

                            {/* Columna Invitación / Acceso */}
                            <TableCell className="px-4 py-3">
                              {invite.isPending ? (
                                <div className="flex flex-col gap-1 items-start">
                                  <Badge variant="outline" className="gap-1 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 bg-amber-500/10 text-[11px] font-medium">
                                    <ClockIcon className="size-3 text-amber-600 dark:text-amber-400" />
                                    Invitación pendiente
                                  </Badge>
                                  <div className="flex items-center gap-1.5 text-[11px]">
                                    <button
                                      type="button"
                                      onClick={() => handleResendInvitation(user)}
                                      disabled={isResending}
                                      className="text-primary hover:underline font-medium cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                                      title="Enviar un nuevo correo de invitación"
                                    >
                                      <RefreshCwIcon className={`size-3 ${isResending ? "animate-spin" : ""}`} />
                                      <span>{isResending ? "Reenviando..." : "Reenviar"}</span>
                                    </button>
                                    <span className="text-muted-foreground/40">·</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyInviteLink(user)}
                                      className="text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
                                      title="Copiar enlace directo para definir contraseña"
                                    >
                                      {isCopied ? "¡Copiado!" : "Copiar enlace"}
                                    </button>
                                  </div>
                                </div>
                              ) : invite.isExpired ? (
                                <div className="flex flex-col gap-1 items-start">
                                  <Badge variant="outline" className="gap-1 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 bg-rose-500/10 text-[11px] font-medium">
                                    <AlertCircleIcon className="size-3 text-rose-600 dark:text-rose-400" />
                                    Invitación vencida
                                  </Badge>
                                  <button
                                    type="button"
                                    onClick={() => handleResendInvitation(user)}
                                    disabled={isResending}
                                    className="text-[11px] text-primary hover:underline font-medium cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                                    title="Renovar y enviar nueva invitación"
                                  >
                                    <RefreshCwIcon className={`size-3 ${isResending ? "animate-spin" : ""}`} />
                                    <span>{isResending ? "Reenviando..." : "Reenviar invitación"}</span>
                                  </button>
                                </div>
                              ) : invite.isUsed ? (
                                <Badge variant="outline" className="gap-1 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 bg-emerald-500/10 text-[11px] font-medium">
                                  <CheckCircle2Icon className="size-3 text-emerald-600 dark:text-emerald-400" />
                                  Contraseña creada
                                </Badge>
                              ) : (
                                <div className="flex flex-col gap-0.5 items-start">
                                  <span className="text-xs text-muted-foreground">Acceso directo</span>
                                  <button
                                    type="button"
                                    onClick={() => handleResendInvitation(user)}
                                    disabled={isResending}
                                    className="text-[11px] text-primary hover:underline font-medium cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                                  >
                                    <SendIcon className="size-3" />
                                    <span>{isResending ? "Enviando..." : "Enviar invitación"}</span>
                                  </button>
                                </div>
                              )}
                            </TableCell>

                            {/* Acciones */}
                            <TableCell className="px-4 py-3 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  render={<Button variant="ghost" size="icon" className="size-8 text-muted-foreground data-open:bg-muted cursor-pointer" />}
                                >
                                  <EllipsisVerticalIcon className="size-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => handleOpenEdit(user)}>
                                    Editar
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() => handleResendInvitation(user)}
                                    disabled={isResending}
                                  >
                                    {isResending
                                      ? "Reenviando..."
                                      : invite.isPending || invite.isExpired
                                      ? "Reenviar invitación"
                                      : "Enviar invitación"}
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() => handleCopyInviteLink(user)}
                                  >
                                    Copiar enlace
                                  </DropdownMenuItem>

                                  <DropdownMenuItem className="cursor-pointer" onClick={() => handleOpenPassword(user)}>
                                    Cambiar contraseña
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => handleToggleStatus(user)} disabled={user.id === currentUserId}>
                                    {user.status === "activo" ? "Desactivar" : "Activar"}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    variant="destructive"
                                    className="cursor-pointer"
                                    onClick={() => handleDelete(user)}
                                    disabled={user.id === currentUserId}
                                  >
                                    Eliminar
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

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t text-xs text-muted-foreground">
                  <span>
                    {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, filtered.length)} de {filtered.length} usuarios
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="size-8 cursor-pointer" onClick={() => setPageIndex(0)} disabled={currentPage === 0}><ChevronsLeftIcon className="size-4" /></Button>
                    <Button variant="outline" size="icon" className="size-8 cursor-pointer" onClick={() => setPageIndex((p) => Math.max(0, p - 1))} disabled={currentPage === 0}><ChevronLeftIcon className="size-4" /></Button>
                    <Button variant="outline" size="icon" className="size-8 cursor-pointer" onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1}><ChevronRightIcon className="size-4" /></Button>
                    <Button variant="outline" size="icon" className="size-8 cursor-pointer" onClick={() => setPageIndex(totalPages - 1)} disabled={currentPage >= totalPages - 1}><ChevronsRightIcon className="size-4" /></Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Add User Dialog ─── */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleAdd}>
            <DialogHeader>
              <DialogTitle>Nuevo Usuario</DialogTitle>
              <DialogDescription>Creá una cuenta para un miembro del equipo.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {addError && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-xs text-destructive">
                  {addError}
                </div>
              )}
              <div className="grid gap-2">
                <Label>Nombre completo</Label>
                <Input placeholder="Ej: Padre Martín" value={addNombre} onChange={(e) => setAddNombre(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label>Correo electrónico</Label>
                <Input type="email" placeholder="correo@parroquia.org" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label>Rol</Label>
                <div className="grid gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setAddRol(r.value)}
                      className={`flex items-start gap-3 p-3 rounded-lg border text-start transition-all cursor-pointer ${
                        addRol === r.value
                          ? "border-primary/60 bg-primary/5 ring-1 ring-primary/30"
                          : "border-border bg-card hover:bg-accent/40"
                      }`}
                    >
                      <div>
                        <p className="text-xs font-semibold text-foreground">{r.label}</p>
                        <p className="text-[11px] text-muted-foreground">{r.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Switch para envío de correo de bienvenida */}
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20">
                <input
                  id="send-welcome-switch"
                  type="checkbox"
                  checked={sendWelcome}
                  onChange={(e) => setSendWelcome(e.target.checked)}
                  className="size-4 mt-0.5 rounded border-input text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="send-welcome-switch" className="cursor-pointer select-none">
                  <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <MailIcon className="size-3.5 text-primary" />
                    Enviar correo de invitación para definir contraseña
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5 leading-snug">
                    El usuario recibirá un correo con un enlace seguro para crear su contraseña personal e ingresar al panel.
                  </span>
                </label>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0 mt-2">
              <Button type="button" variant="outline" disabled={isSubmittingAdd} onClick={() => setIsAddOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmittingAdd} className="gap-2">
                {isSubmittingAdd ? (
                  <>
                    <div className="size-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    <span>Creando y enviando...</span>
                  </>
                ) : (
                  <span>Crear Usuario</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Edit User Dialog ─── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
              <DialogDescription>Modificá los datos y permisos.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nombre</Label>
                <Input value={editNombre} onChange={(e) => setEditNombre(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label>Correo</Label>
                <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label>Rol</Label>
                <div className="grid gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setEditRol(r.value)}
                      className={`flex items-start gap-3 p-3 rounded-lg border text-start transition-all cursor-pointer ${
                        editRol === r.value
                          ? "border-primary/60 bg-primary/5 ring-1 ring-primary/30"
                          : "border-border bg-card hover:bg-accent/40"
                      }`}
                    >
                      <div>
                        <p className="text-xs font-semibold text-foreground">{r.label}</p>
                        <p className="text-[11px] text-muted-foreground">{r.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              {editingUser?.id !== currentUserId && (
                <div className="grid gap-2">
                  <Label>Estado</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["activo", "inactivo"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setEditStatus(s)}
                        className={`flex flex-col items-start gap-1 p-3 rounded-lg border text-start transition-all cursor-pointer ${
                          editStatus === s
                            ? s === "activo"
                              ? "border-emerald-500/60 bg-emerald-500/5 ring-1 ring-emerald-500/30"
                              : "border-muted-foreground/50 bg-muted/40 ring-1 ring-muted-foreground/30"
                            : "border-border bg-card hover:bg-accent/40"
                        }`}
                      >
                        <span className={`text-xs font-semibold flex items-center gap-1.5 ${s === "activo" ? "text-emerald-600" : "text-muted-foreground"}`}>
                          <span className={`size-2 rounded-full ${s === "activo" ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                          {s === "activo" ? "Activo" : "Inactivo"}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {s === "activo" ? "Puede acceder al panel" : "Sin acceso temporalmente"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0 mt-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Change Password Dialog ─── */}
      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleChangePassword}>
            <DialogHeader>
              <DialogTitle>Cambiar Contraseña</DialogTitle>
              <DialogDescription>Nueva contraseña para {editingUser?.nombre}.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {passwordError && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-xs text-destructive">
                  {passwordError}
                </div>
              )}
              <div className="grid gap-2">
                <Label>Nueva contraseña</Label>
                <Input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Confirmar contraseña</Label>
                <Input
                  type="password"
                  placeholder="Repetir contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPasswordOpen(false)}>Cancelar</Button>
              <Button type="submit">Actualizar Contraseña</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
