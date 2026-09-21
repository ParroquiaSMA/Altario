"use client"

import React, { useState, useEffect } from "react"
import {
  login,
  loginAsync,
  isAuthenticated,
  requestPasswordReset,
  verifyResetToken,
  verifyResetTokenAsync,
  resetPasswordWithToken,
} from "@/lib/auth"
import {
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowLeftIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  ShieldCheckIcon,
} from "lucide-react"

export function LoginView() {
  // If already authenticated and not resetting password, redirect to home
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tokenParam = params.get("reset_token")
    if (!tokenParam && isAuthenticated()) {
      window.location.replace("/")
    }
  }, [])

  const [view, setView] = useState<"login" | "forgot_password" | "reset_password">("login")

  // Form states - Login
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  // Form states - Forgot & Reset
  const [forgotEmail, setForgotEmail] = useState("")
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [resetEmail, setResetEmail] = useState<string>("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isVerifyingResetToken, setIsVerifyingResetToken] = useState(false)
  const [isResetTokenInvalid, setIsResetTokenInvalid] = useState(false)

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [successNotice, setSuccessNotice] = useState("")
  const [directResetLink, setDirectResetLink] = useState<string | null>(null)

  // Detect reset_token from URL on load
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const token = params.get("reset_token")
    if (token) {
      setResetToken(token)
      setView("reset_password")
      setIsVerifyingResetToken(true)
      setIsResetTokenInvalid(false)
      setError("")
      setSuccessNotice("")

      verifyResetTokenAsync(token)
        .then((verification) => {
          if (verification.ok && verification.email) {
            setResetEmail(verification.email)
          } else {
            setIsResetTokenInvalid(true)
            setError(verification.error || "El enlace de recuperación ha expirado o ya fue utilizado.")
          }
          setIsVerifyingResetToken(false)
        })
        .catch(() => {
          setIsResetTokenInvalid(true)
          setError("Error al verificar el enlace de recuperación.")
          setIsVerifyingResetToken(false)
        })
    }
  }, [])

  // ── Handle Login ─────────────────────────────────────────────────────────
  const handleLoginSubmit = (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault()
    setError("")
    setSuccessNotice("")

    const targetEmail = (customEmail || email).trim()
    const targetPassword = customPass !== undefined ? customPass : password

    if (!targetEmail || !targetPassword) {
      setError("Completá todos los campos para ingresar.")
      return
    }

    setIsLoading(true)

    loginAsync(targetEmail, targetPassword, rememberMe)
      .then((result) => {
        if (result.ok) {
          window.location.replace("/")
        } else {
          setError(result.error || "Error al iniciar sesión.")
          setIsLoading(false)
        }
      })
      .catch(() => {
        setError("Error al iniciar sesión.")
        setIsLoading(false)
      })
  }

  // ── Handle Forgot Password ───────────────────────────────────────────────
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessNotice("")
    setDirectResetLink(null)

    const targetEmail = forgotEmail.trim()
    if (!targetEmail) {
      setError("Ingresá el correo electrónico de tu cuenta.")
      return
    }

    setIsLoading(true)

    try {
      const res = await requestPasswordReset(targetEmail)
      if (!res.ok) {
        setError(res.error || "No se pudo procesar la solicitud.")
      } else {
        if (res.emailSent) {
          setSuccessNotice(
            `¡Enlace enviado! Revisá la bandeja de entrada de ${targetEmail} (y la carpeta de spam).`
          )
        } else {
          setSuccessNotice(
            `Solicitud generada para ${targetEmail}. Si estás en entorno de pruebas, podés acceder directamente con el enlace debajo:`
          )
          if (res.resetLink) {
            setDirectResetLink(res.resetLink)
          }
        }
      }
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error al enviar el enlace.")
    } finally {
      setIsLoading(false)
    }
  }

  // ── Handle Reset Password ────────────────────────────────────────────────
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessNotice("")

    if (!resetToken) {
      setError("Token de recuperación no válido.")
      return
    }

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas ingresadas no coinciden.")
      return
    }

    setIsLoading(true)

    try {
      const res = await resetPasswordWithToken(resetToken, newPassword)
      if (!res.ok) {
        setError(res.error || "No se pudo restablecer la contraseña.")
        setIsLoading(false)
      } else {
        setSuccessNotice(
          resetToken?.startsWith("inv_")
            ? "¡Contraseña creada con éxito! Redirigiendo al inicio de sesión..."
            : "¡Contraseña actualizada con éxito! Redirigiendo al inicio de sesión..."
        )
        setTimeout(() => {
          window.history.replaceState({}, "", "/login")
          setView("login")
          setSuccessNotice("")
          setPassword("")
          setIsLoading(false)
        }, 1800)
      }
    } catch (err: any) {
      setError(err?.message || "Error al actualizar la contraseña.")
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col md:flex-row bg-background text-foreground font-sans">
      {/* ══ PANEL IZQUIERDO HERO ══════════════════════════════════════════════ */}
      <div className="relative md:w-[42%] lg:w-[38%] bg-[#121B33] text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between overflow-hidden shrink-0 border-r border-[#1e2c4f]">
        {/* Subtle Ambient Glow */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              radial-gradient(75% 60% at 20% 80%, rgba(30, 58, 138, 0.5), transparent 70%)
            `,
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-[#C9A96A] text-[#121B33] font-bold text-xl flex items-center justify-center shadow-xs">
            A
          </div>
          <div>
            <span className="text-lg font-semibold tracking-tight text-white flex items-center gap-1.5">
              Altario <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/10 text-[#C9A96A] border border-white/15">CMS</span>
            </span>
            <p className="text-[11px] text-white/50">Santa María de la Ayuda</p>
          </div>
        </div>

        {/* Central message simple y sobrio */}
        <div className="relative z-10 my-auto py-10 max-w-[340px]">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white leading-snug">
            Panel de administración
          </h1>
          <p className="text-sm text-white/60 mt-3 leading-relaxed">
            Acceso al sistema de gestión parroquial.
          </p>
        </div>

        {/* Bottom */}
        <div className="relative z-10 text-xs text-white/40">
          <span>Parroquia Santa María de la Ayuda</span>
        </div>
      </div>

      {/* ══ PANEL DERECHO: FORMULARIOS (Interactivo) ════════════════════════════ */}
      <div className="flex-1 h-full flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 overflow-y-auto bg-background">
        <div className="w-full max-w-[390px]">
          {/* ── VISTA 1: INICIAR SESIÓN ─────────────────────────────────────── */}
          {view === "login" && (
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Iniciar sesión
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Ingresá con tu correo institucional o autorizado.
              </p>

              {error && (
                <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircleIcon className="size-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successNotice && (
                <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-start gap-2 animate-in fade-in">
                  <CheckCircle2Icon className="size-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{successNotice}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="login-email" className="text-xs font-medium text-foreground block">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="correo@parroquia.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm shadow-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="login-password" className="text-xs font-medium text-foreground block">
                      Contraseña
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setError("")
                        setSuccessNotice("")
                        setForgotEmail(email)
                        setView("forgot_password")
                      }}
                      className="text-xs text-primary hover:underline transition-colors cursor-pointer"
                    >
                      ¿La olvidaste?
                    </button>
                  </div>
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-10 pl-9 pr-10 rounded-md border border-input bg-background text-sm shadow-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer transition-colors"
                    >
                      {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* Checkbox Mantener sesión */}
                <div className="flex items-center gap-2 pt-0.5 pb-1">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="size-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="text-xs text-muted-foreground cursor-pointer select-none">
                    Mantener la sesión en esta computadora
                  </label>
                </div>

                {/* Botón Principal */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="size-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      <span>Ingresando...</span>
                    </>
                  ) : (
                    <span>Iniciar Sesión</span>
                  )}
                </button>
              </form>


              {/* Nota inferior */}
              <div className="mt-5 p-3 rounded-lg bg-muted/40 border border-border flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
                <ShieldCheckIcon className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
                <div>
                  ¿No tenés usuario asignado? Solicitá el alta a la secretaría o al administrador parroquial.
                </div>
              </div>
            </div>
          )}

          {/* ── VISTA 2: RECUPERAR CONTRASEÑA ───────────────────────────────── */}
          {view === "forgot_password" && (
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Recuperar el acceso
              </h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Te enviamos un enlace por correo para crear una contraseña nueva. Válido por 30 minutos.
              </p>

              {error && (
                <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircleIcon className="size-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successNotice && (
                <div className="mt-4 p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs space-y-2 animate-in fade-in">
                  <div className="flex items-start gap-2">
                    <CheckCircle2Icon className="size-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{successNotice}</span>
                  </div>

                  {directResetLink && (
                    <div className="pt-2 border-t border-emerald-500/20 mt-2">
                      <p className="font-semibold text-[11px] mb-1">Enlace directo de restablecimiento:</p>
                      <a
                        href={directResetLink}
                        className="text-[11px] text-primary underline break-all font-mono hover:opacity-80"
                      >
                        {directResetLink}
                      </a>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleForgotPasswordSubmit} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="forgot-email" className="text-xs font-medium text-foreground block">
                    Correo de tu cuenta
                  </label>
                  <div className="relative">
                    <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="correo@parroquia.org"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm shadow-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="size-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      <span>Enviando enlace...</span>
                    </>
                  ) : (
                    <span>Enviar enlace de recuperación</span>
                  )}
                </button>

                <div className="p-3 rounded-lg bg-muted/40 border border-border flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
                  <MailIcon className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
                  <div>
                    El correo se despacha mediante Resend. Si no lo ves en tu bandeja principal dentro de 1 minuto, revisá la carpeta de Spam.
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setError("")
                      setSuccessNotice("")
                      setDirectResetLink(null)
                      setView("login")
                    }}
                    className="w-full h-9 rounded-md border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeftIcon className="size-3.5" />
                    <span>Volver a iniciar sesión</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── VISTA 3: RESTABLECER CONTRASEÑA ─────────────────────────────── */}
          {view === "reset_password" && (
            <div>
              {isVerifyingResetToken ? (
                <div className="py-12 text-center space-y-3">
                  <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground">Verificando enlace de seguridad...</p>
                </div>
              ) : isResetTokenInvalid ? (
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Enlace no disponible
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Este enlace de recuperación ha vencido o ya fue utilizado anteriormente.
                  </p>

                  <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                    <AlertCircleIcon className="size-4 shrink-0 mt-0.5" />
                    <span>{error || "El enlace no es válido o ya fue utilizado."}</span>
                  </div>

                  <div className="mt-6 space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        window.history.replaceState({}, "", "/login")
                        setError("")
                        setSuccessNotice("")
                        setView("forgot_password")
                      }}
                      className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-xs flex items-center justify-center cursor-pointer"
                    >
                      Solicitar un nuevo enlace
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        window.history.replaceState({}, "", "/login")
                        setError("")
                        setSuccessNotice("")
                        setView("login")
                      }}
                      className="w-full h-9 rounded-md border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeftIcon className="size-3.5" />
                      <span>Volver al inicio de sesión</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    {resetToken?.startsWith("inv_") ? "Configurar contraseña" : "Restablecer contraseña"}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {resetEmail ? (
                      <>
                        Para la cuenta <span className="font-semibold text-foreground">{resetEmail}</span>
                      </>
                    ) : (
                      "Ingresá tu nueva contraseña para acceder a Altario CMS."
                    )}
                  </p>

                  {error && (
                    <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2 animate-in fade-in">
                      <AlertCircleIcon className="size-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {successNotice && (
                    <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-start gap-2 animate-in fade-in">
                      <CheckCircle2Icon className="size-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{successNotice}</span>
                    </div>
                  )}

                  <form onSubmit={handleResetPasswordSubmit} className="mt-6 space-y-4">
                    <div className="space-y-1.5">
                      <label htmlFor="reset-new-pass" className="text-xs font-medium text-foreground block">
                        Nueva contraseña
                      </label>
                      <div className="relative">
                        <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                        <input
                          id="reset-new-pass"
                          type={showNewPassword ? "text" : "password"}
                          required
                          placeholder="Mínimo 6 caracteres"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full h-10 pl-9 pr-10 rounded-md border border-input bg-background text-sm shadow-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          tabIndex={-1}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer transition-colors"
                        >
                          {showNewPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="reset-confirm-pass" className="text-xs font-medium text-foreground block">
                        Confirmar nueva contraseña
                      </label>
                      <div className="relative">
                        <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                        <input
                          id="reset-confirm-pass"
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          placeholder="Repetí la contraseña"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full h-10 pl-9 pr-10 rounded-md border border-input bg-background text-sm shadow-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          tabIndex={-1}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer transition-colors"
                        >
                          {showConfirmPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <div className="size-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <span>{resetToken?.startsWith("inv_") ? "Crear contraseña e ingresar" : "Restablecer contraseña"}</span>
                      )}
                    </button>

                    <div className="pt-2 border-t border-border">
                      <button
                        type="button"
                        onClick={() => {
                          window.history.replaceState({}, "", "/login")
                          setError("")
                          setSuccessNotice("")
                          setView("login")
                        }}
                        className="w-full h-9 rounded-md border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ArrowLeftIcon className="size-3.5" />
                        <span>Cancelar y volver al login</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoginView

