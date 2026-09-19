import * as React from "react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"
import { NotificationsManager } from "@/components/common/notifications-manager"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getSession, requireAuth, type Session } from "@/lib/auth"
import { cn } from "@/lib/utils"

interface DashboardShellProps {
  title?: string
  currentPath?: string
  actions?: React.ReactNode
  noScroll?: boolean
  children: React.ReactNode
}

export function DashboardShell({
  title = "Dashboard",
  currentPath = "/",
  actions,
  noScroll,
  children,
}: DashboardShellProps) {
  const [session, setSession] = React.useState<Session | null>(null)

  React.useEffect(() => {
    requireAuth()
    const s = getSession()
    setSession(s)
  }, [])

  const user = session
    ? { name: session.nombre, email: session.email }
    : { name: "Administrador", email: "" }

  const isFixedLayout =
    noScroll || currentPath === "/settings" || currentPath === "/settings-web"

  return (
    <>
      <SidebarProvider
        className="h-full w-full overflow-hidden bg-background md:bg-sidebar"
        style={
          {
            "--sidebar-width": "16rem",
            "--header-height": "3rem",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" currentPath={currentPath} user={user} />
        <SidebarInset className="h-full sm:h-[calc(100vh-1rem)] m-0 sm:my-2 sm:mr-2 overflow-hidden flex flex-col rounded-none sm:rounded-xl border-0 sm:border bg-background shadow-none sm:shadow-xs">
          <SiteHeader title={title} actions={actions} />
          <div
            className={cn(
              "flex-1 min-h-0 flex flex-col w-full",
              isFixedLayout ? "overflow-hidden h-full" : "overflow-y-auto"
            )}
          >
            <div
              className={cn(
                "flex flex-1 flex-col min-w-0 min-h-0 w-full",
                isFixedLayout ? "h-full" : "pb-32 md:pb-6",
                !isFixedLayout && "max-w-[1440px] mx-auto"
              )}
            >
              {children}
            </div>
          </div>
          <NotificationsManager />
        </SidebarInset>
        <MobileBottomNav currentPath={currentPath} />
      </SidebarProvider>
    </>
  )
}
