import * as React from "react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { CirclePlusIcon } from "lucide-react"

export function NavMain({
  items,
  currentPath = "/",
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
  }[]
  currentPath?: string
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">

        {/* Nav Items */}
        <SidebarMenu>
          {items.map((item) => {
            const isActive =
              currentPath === item.url ||
              (item.url !== "/" && currentPath.startsWith(item.url))
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={isActive}
                  render={<a href={item.url} />}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
