import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

interface SiteHeaderProps {
  title?: string
  actions?: React.ReactNode
}

export function SiteHeader({ title = "Dashboard", actions }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex h-12 shrink-0 items-center gap-2 border-b bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center justify-between gap-2 px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-1 h-4 data-vertical:self-auto" />
          <h1 className="text-sm font-medium">{title}</h1>
        </div>
        {actions && (
          <div className="flex items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  )
}
