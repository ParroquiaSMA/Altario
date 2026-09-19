import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { NavUser } from "@/components/layout/nav-user"

interface SiteHeaderProps {
  title?: React.ReactNode
  center?: React.ReactNode
  actions?: React.ReactNode
  children?: React.ReactNode
  user?: {
    name: string
    email: string
    avatar?: string
  }
}

export function SiteHeader({
  title = "Dashboard",
  center,
  actions,
  children,
  user,
}: SiteHeaderProps) {
  const headerActions = actions || children

  return (
    <header className="sticky top-0 z-50 bg-background rounded-none sm:rounded-t-xl flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="relative flex w-full items-center justify-between gap-2 px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          <SidebarTrigger className="-ms-1 shrink-0 hidden md:inline-flex" />
          <Separator
            orientation="vertical"
            className="mx-1 sm:mx-2 h-4 data-vertical:self-auto shrink-0 hidden md:block"
          />
          <div className="text-sm font-medium truncate max-w-[220px] sm:max-w-xs md:max-w-none">
            {title}
          </div>
        </div>

        {center && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center z-10">
            {center}
          </div>
        )}

        <div className="flex items-center gap-2.5 sm:gap-3">
          {headerActions}
          {user && <NavUser user={user} />}
        </div>
      </div>
    </header>
  )
}
