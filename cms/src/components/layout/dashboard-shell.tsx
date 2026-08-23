import * as React from "react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getSession, requireAuth, type Session } from "@/lib/auth"

interface DashboardShellProps {
  title?: string
  currentPath?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export function DashboardShell({
  title = "Dashboard",
  currentPath = "/",
  actions,
  children,
}: DashboardShellProps) {
  const [session, setSession] = React.useState<Session | null>(null)
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    requireAuth()
    const s = getSession()
    setSession(s)
    setReady(true)
  }, [])

  if (!ready) return null

  const user = session
    ? { name: session.nombre, email: session.email }
    : { name: "Cargando...", email: "" }

  return (
    <SidebarProvider
      className="h-screen overflow-hidden bg-sidebar"
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" currentPath={currentPath} user={user} />
      <SidebarInset className="h-[calc(100vh-1rem)] my-2 mr-2 overflow-hidden flex flex-col rounded-lg border bg-background">
        <SiteHeader title={title} actions={actions} />
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
