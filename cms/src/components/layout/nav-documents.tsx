import * as React from "react"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavDocuments({
  items,
  title = "Sitio web",
  currentPath = "/",
}: {
  title?: string
  currentPath?: string
  items: {
    name: string
    url: string
    icon: React.ReactNode
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive =
            currentPath === item.url ||
            (item.url !== "/" && currentPath.startsWith(item.url))
          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                tooltip={item.name}
                isActive={isActive}
                render={<a href={item.url} />}
              >
                {item.icon}
                <span>{item.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
