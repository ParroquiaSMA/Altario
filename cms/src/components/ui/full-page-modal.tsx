import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon } from "lucide-react"

interface FullPageModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export function FullPageModal({
  open,
  onClose,
  title,
  subtitle,
  actions,
  children,
}: FullPageModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" />
      <div className="relative z-50 flex flex-col w-full h-full max-w-7xl max-h-[92vh] rounded-xl border border-border bg-background shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background px-4 lg:px-6">
          <div className="flex items-center gap-1 lg:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="size-8 -ms-1 text-muted-foreground hover:text-foreground"
              title="Volver"
            >
              <ArrowLeftIcon className="size-4" />
              <span className="sr-only">Volver</span>
            </Button>
            <Separator orientation="vertical" className="mx-2 h-4 data-vertical:self-auto" />
            <div className="flex items-center gap-2">
              <h1 className="text-base font-medium text-foreground">{title}</h1>
              {subtitle && (
                <>
                  <span className="text-muted-foreground/40 font-light text-sm">/</span>
                  <span className="text-sm font-normal text-muted-foreground">{subtitle}</span>
                </>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex items-center gap-2">{actions}</div>
          )}
        </header>
        <div className="flex-1 flex overflow-hidden min-h-0 bg-background">
          {children}
        </div>
      </div>
    </div>
  )
}
