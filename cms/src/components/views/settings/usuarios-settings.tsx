"use client"

import * as React from "react"
import {
  getUsers,
  addUser,
  updateUser,
  deleteUser,
  changeUserPassword,
  getSession,
  type CMSUser,
} from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PlusIcon,
  SearchIcon,
  EllipsisVerticalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  KeyRoundIcon,
} from "lucide-react"

const ROLES: { value: CMSUser["rol"]; label: string; desc: string }[] = [
  { value: "admin", label: "Administrador", desc: "Acceso completo a todo el panel" },
  { value: "editor", label: "Editor", desc: "Puede crear y editar contenido" },
  { value: "viewer", label: "Solo lectura", desc: "Solo puede ver el contenido" },
]

export function UsuariosSettings() {
  const [users, setUsers] = React.useState<CMSUser[]>([])
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")

  // Modals
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<CMSUser | null>(null)

  // Add form
  const [addNombre, setAddNombre] = React.useState("")
  const [addEmail, setAddEmail] = React.useState("")
  const [addRol, setAddRol] = React.useState<CMSUser["rol"]>("editor")
  const [addPassword, setAddPassword] = React.useState("")
  const [addError, setAddError] = React.useState("")

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

  React.useEffect(() => {
    setUsers(getUsers())
    const session = getSession()
    if (session) setCurrentUserId(session.userId)
  }, [])

  const refresh = () => setUsers(getUsers())

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
    setAddNombre(""); setAddEmail(""); setAddRol("editor"); setAddPassword(""); setAddError("")
    setIsAddOpen(true)
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    setAddError("")
    if (!addNombre.trim() || !addEmail.trim()) return
    if (addPassword.length < 6) { setAddError("La contraseña debe tener al menos 6 caracteres"); return }
    const emailExists = users.some((u) => u.email.toLowerCase() === addEmail.toLowerCase())
    if (emailExists) { setAddError("Ya existe un usuario con ese correo"); return }

    addUser({ nombre: addNombre.trim(), email: addEmail.trim(), rol: addRol, status: "activo", password: addPassword })
    refresh()
    setIsAddOpen(false)
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
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Usuarios del Panel</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gestioná quién tiene acceso al CMS y con qué permisos.
        </p>
      </div>

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
        <Button onClick={handleOpenAdd} className="w-full sm:w-auto gap-2">
          <PlusIcon className="size-4" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Table Card */}
      <Card className="p-0">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No hay usuarios registrados.
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Estado</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Nombre</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden sm:table-cell">Correo</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Rol</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((user) => (
                    <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        {user.status === "activo" ? (
                          <Badge variant="outline" className="gap-1.5 text-emerald-600 border-emerald-300">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1.5 text-muted-foreground">
                            <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                            Inactivo
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {user.nombre}
                        {user.id === currentUserId && (
                          <span className="ml-2 text-[10px] text-muted-foreground bg-muted rounded px-1 py-0.5">Tú</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{user.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-xs font-normal">{rolLabel(user.rol)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={<Button variant="ghost" size="icon" className="size-8 text-muted-foreground data-open:bg-muted" />}
                          >
                            <EllipsisVerticalIcon className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => handleOpenEdit(user)}>Editar datos</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenPassword(user)}>
                              <KeyRoundIcon />
                              Cambiar contraseña
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(user)} disabled={user.id === currentUserId}>
                              {user.status === "activo" ? "Desactivar" : "Activar"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => handleDelete(user)}
                              disabled={user.id === currentUserId}
                            >
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex items-center justify-between gap-4 px-4 py-3 border-t text-xs text-muted-foreground">
                <span>
                  {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, filtered.length)} de {filtered.length} usuarios
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="size-8" onClick={() => setPageIndex(0)} disabled={currentPage === 0}><ChevronsLeftIcon className="size-4" /></Button>
                  <Button variant="outline" size="icon" className="size-8" onClick={() => setPageIndex((p) => Math.max(0, p - 1))} disabled={currentPage === 0}><ChevronLeftIcon className="size-4" /></Button>
                  <Button variant="outline" size="icon" className="size-8" onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1}><ChevronRightIcon className="size-4" /></Button>
                  <Button variant="outline" size="icon" className="size-8" onClick={() => setPageIndex(totalPages - 1)} disabled={currentPage >= totalPages - 1}><ChevronsRightIcon className="size-4" /></Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ─── Add User Dialog ─── */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
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
                <Label>Contraseña inicial</Label>
                <Input type="password" placeholder="Mínimo 6 caracteres" value={addPassword} onChange={(e) => setAddPassword(e.target.value)} required />
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
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
              <Button type="submit">Crear Usuario</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Edit User Dialog ─── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Change Password Dialog ─── */}
      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent className="sm:max-w-sm">
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
