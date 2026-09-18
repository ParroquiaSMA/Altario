import * as React from "react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  EllipsisVerticalIcon,
  SettingsIcon,
  LogOutIcon,
  SunIcon,
  MoonIcon,
  LaptopIcon,
  ExternalLinkIcon,
  CheckIcon,
} from "lucide-react"
import { logout } from "@/lib/auth"
import { getLocalConfig } from "@/lib/config"

function getPublicWebUrl(): string {
  if (typeof window !== "undefined") {
    const config = getLocalConfig()
    const dom = config?.dominio?.dominio_web
    if (dom) {
      return dom.startsWith("http") ? dom : `https://${dom}`
    }
  }
  return "https://santamariadelaayuda.org"
}

interface User {
  name: string
  email: string
  avatar?: string
}

function getInitials(name: string) {
  if (!name) return "U"
  const parts = name.trim().split(" ")
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.substring(0, 2).toUpperCase()
}

export function applyTheme(theme: "light" | "dark" | "system") {
  if (typeof window === "undefined") return
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)

  const html = document.documentElement
  if (isDark) {
    html.classList.add("dark")
  } else {
    html.classList.remove("dark")
  }
}

export function setTheme(theme: "light" | "dark" | "system") {
  applyTheme(theme)
  try {
    localStorage.setItem("theme", theme)
  } catch {}
}

export function NavUser({ user }: { user: User }) {
  const { isMobile } = useSidebar()
  const [currentTheme, setCurrentTheme] = React.useState<"light" | "dark" | "system">("dark")
  const [webUrl, setWebUrl] = React.useState("https://santamariadelaayuda.org")

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("theme") as "light" | "dark" | "system" | null
      if (saved) {
        setCurrentTheme(saved)
        applyTheme(saved)
      }
    } catch {}
    setWebUrl(getPublicWebUrl())
  }, [])

  const handleLogout = () => {
    logout()
    window.location.replace("/login")
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                <AvatarFallback className="rounded-lg font-medium">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
              <EllipsisVerticalIcon className="ms-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                  <Avatar className="size-8 rounded-lg">
                    {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                    <AvatarFallback className="rounded-lg font-medium">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-start text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem render={<a href={webUrl} target="_blank" rel="noreferrer" />}>
                <ExternalLinkIcon />
                Ver Web Pública
              </DropdownMenuItem>
              <DropdownMenuItem render={<a href="/settings" />}>
                <SettingsIcon />
                Configuración
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <SunIcon className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <MoonIcon className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="ms-2">Tema</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={() => {
                      setTheme("light")
                      setCurrentTheme("light")
                    }}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <SunIcon className="size-4" />
                      <span>Claro</span>
                    </div>
                    {currentTheme === "light" && <CheckIcon className="size-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setTheme("dark")
                      setCurrentTheme("dark")
                    }}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <MoonIcon className="size-4" />
                      <span>Oscuro</span>
                    </div>
                    {currentTheme === "dark" && <CheckIcon className="size-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setTheme("system")
                      setCurrentTheme("system")
                    }}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <LaptopIcon className="size-4" />
                      <span>Sistema</span>
                    </div>
                    {currentTheme === "system" && <CheckIcon className="size-4" />}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOutIcon />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
