"use client"

import * as React from "react"
import {
  LayoutDashboardIcon,
  BellRingIcon,
  HeartHandshakeIcon,
  MailIcon,
  MenuIcon,
  ClockIcon,
  UsersIcon,
  ImageIcon,
  ChurchIcon,
  SettingsIcon,
  GlobeIcon,
  LogOutIcon,
  XIcon,
} from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"
import { logout } from "@/lib/auth"

interface MobileBottomNavProps {
  currentPath?: string
}

export function MobileBottomNav({ currentPath = "/" }: MobileBottomNavProps) {
  const { toggleSidebar, isMobile } = useSidebar()
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  const navItems = [
    {
      title: "Inicio",
      href: "/",
      icon: LayoutDashboardIcon,
      isActive: currentPath === "/",
    },
    {
      title: "Avisos",
      href: "/avisos",
      icon: BellRingIcon,
      isActive: currentPath === "/avisos",
    },
    {
      title: "Donaciones",
      href: "/donaciones",
      icon: HeartHandshakeIcon,
      isActive: currentPath === "/donaciones",
    },
    {
      title: "Mensajes",
      href: "/mensajes",
      icon: MailIcon,
      isActive: currentPath === "/mensajes",
    },
  ]

  const moreItems = [
    { title: "Horarios y Misas", href: "/horarios", icon: ClockIcon },
    { title: "Comunidad y Grupos", href: "/comunidad", icon: UsersIcon },
    { title: "Galería de Fotos", href: "/galeria", icon: ImageIcon },
    { title: "Sacramentos", href: "/sacramentos", icon: ChurchIcon },
    { title: "Ajustes del Sitio Web", href: "/settings-web", icon: GlobeIcon },
    { title: "Ajustes del Sistema", href: "/settings", icon: SettingsIcon },
  ]

  const isMoreActive =
    !navItems.some((item) => item.isActive) &&
    moreItems.some((item) => currentPath.startsWith(item.href))

  const handleOpenMenu = () => {
    // We can open the drawer sheet directly for a fast native bottom sheet feel
    setDrawerOpen(true)
  }

  return (
    <>
      {/* ── Fixed Bottom Navigation Bar (Mobile only) ──────────────── */}
      <nav
        aria-label="Navegación móvil"
        className="fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-md border-t border-border flex md:hidden items-center justify-around px-2 py-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] shadow-lg select-none"
      >
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-lg text-[10px] font-medium transition-colors ${
                item.isActive
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div
                className={`flex items-center justify-center size-8 rounded-full transition-all ${
                  item.isActive ? "bg-accent text-accent-foreground scale-105" : ""
                }`}
              >
                <Icon className="size-4.5" />
              </div>
              <span className="mt-0.5 truncate">{item.title}</span>
            </a>
          )
        })}

        {/* More / Menu Trigger */}
        <button
          type="button"
          onClick={handleOpenMenu}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
            isMoreActive || drawerOpen
              ? "text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div
            className={`flex items-center justify-center size-8 rounded-full transition-all ${
              isMoreActive || drawerOpen ? "bg-accent text-accent-foreground scale-105" : ""
            }`}
          >
            <MenuIcon className="size-4.5" />
          </div>
          <span className="mt-0.5 truncate">Más</span>
        </button>
      </nav>

      {/* ── Native Bottom Drawer for "Más opciones" ────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative z-50 bg-background border-t border-border rounded-t-2xl shadow-2xl p-4 max-h-[85vh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-200">
            {/* Header handle */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-muted-foreground/30 rounded-full mx-auto" />
                <span className="text-sm font-semibold text-foreground">Más opciones</span>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <XIcon className="size-5" />
              </button>
            </div>

            {/* Grid of extra links */}
            <div className="grid grid-cols-2 gap-2.5 py-4">
              {moreItems.map((item) => {
                const Icon = item.icon
                const isActive = currentPath === item.href || currentPath.startsWith(item.href + "/")
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium transition-all ${
                      isActive
                        ? "bg-accent text-accent-foreground border-border font-semibold shadow-2xs"
                        : "bg-muted/20 border-border/60 text-foreground hover:bg-muted/60"
                    }`}
                  >
                    <div className="size-8 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
                      <Icon className="size-4 text-foreground/80" />
                    </div>
                    <span className="truncate">{item.title}</span>
                  </a>
                )
              })}
            </div>

            {/* Footer / Logout */}
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <a
                href="http://localhost:4321"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 py-2 px-2"
              >
                <GlobeIcon className="size-3.5" />
                <span>Ver sitio web</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false)
                  logout()
                }}
                className="text-xs text-destructive hover:bg-destructive/10 flex items-center gap-1.5 py-2 px-3 rounded-lg font-medium cursor-pointer"
              >
                <LogOutIcon className="size-3.5" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
