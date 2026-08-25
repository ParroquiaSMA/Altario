import * as React from "react"
import { NavDocuments } from "@/components/layout/nav-documents"
import { NavMain } from "@/components/layout/nav-main"
import { NavSecondary } from "@/components/layout/nav-secondary"
import { NavUser } from "@/components/layout/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  ClockIcon,
  MegaphoneIcon,
  ImagesIcon,
  MailIcon,
  GlobeIcon,
  PaletteIcon,
  ExternalLinkIcon,
  SettingsIcon,
} from "lucide-react"

const NAV_MAIN = [
  { title: "Dashboard", url: "/", icon: <LayoutDashboardIcon /> },
  { title: "Mensajes", url: "/mensajes", icon: <MailIcon /> },
]

const NAV_SITIO_WEB = [
  { name: "Horarios", url: "/horarios", icon: <ClockIcon /> },
  { name: "Avisos", url: "/avisos", icon: <MegaphoneIcon /> },
  { name: "Galería", url: "/galeria", icon: <ImagesIcon /> },
  { name: "Ajustes web", url: "/settings-web", icon: <PaletteIcon /> },
]

const NAV_SECONDARY = [
  { title: "Ver web", url: "http://localhost:4321", icon: <ExternalLinkIcon />, target: "_blank" },
  { title: "Ajustes del sistema", url: "/settings", icon: <SettingsIcon /> },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  currentPath?: string
  user?: { name: string; email: string; avatar?: string }
}

export function AppSidebar({
  currentPath = "/",
  user,
  ...props
}: AppSidebarProps) {
  const resolvedUser = user ?? {
    name: "Secretaría Parroquial",
    email: "secretaria@santamariadelaayuda.org",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Altario" render={<a href="/" />}>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground text-background text-sm font-bold">
                A
              </div>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-semibold">Altario</span>
                <span className="truncate text-xs text-muted-foreground">Santa María de la Ayuda</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={NAV_MAIN} currentPath={currentPath} />
        <NavDocuments items={NAV_SITIO_WEB} title="Sitio web" currentPath={currentPath} />
        <NavSecondary items={NAV_SECONDARY} currentPath={currentPath} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={resolvedUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
