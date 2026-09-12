"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { uploadMediaFile } from "@/lib/storage"
import {
  UploadCloudIcon,
  LinkIcon,
  Trash2Icon,
  Loader2Icon,
  RefreshCwIcon,
} from "lucide-react"

export interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onRemove?: () => void
  label?: string
  description?: string
  folder?: "logos" | "parroco" | "galeria" | "general"
  aspectRatio?: "square" | "portrait" | "video" | "wide" | "auto"
  allowUrlInput?: boolean
  className?: string
  disabled?: boolean
}

export function ImageUpload({
  value = "",
  onChange,
  onRemove,
  label,
  description,
  folder = "general",
  aspectRatio = "auto",
  allowUrlInput = true,
  className = "",
  disabled = false,
}: ImageUploadProps) {
  const [mode, setMode] = React.useState<"upload" | "url">("upload")
  const [urlInput, setUrlInput] = React.useState(value)
  const [isUploading, setIsUploading] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const [previewError, setPreviewError] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Sync internal url state when external value changes
  React.useEffect(() => {
    setUrlInput(value || "")
    setPreviewError(false)
  }, [value])

  const handleFileSelect = async (file?: File | null) => {
    if (!file || disabled) return
    setIsUploading(true)
    setPreviewError(false)
    try {
      const uploadedUrl = await uploadMediaFile(file, folder)
      onChange(uploadedUrl)
    } catch (err) {
      console.error("Error al subir imagen:", err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled || isUploading) return
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) {
      handleFileSelect(file)
    }
  }

  const handleUrlApply = () => {
    if (!urlInput.trim()) {
      handleClear()
      return
    }
    onChange(urlInput.trim())
  }

  const handleClear = () => {
    onChange("")
    setUrlInput("")
    setPreviewError(false)
    if (onRemove) onRemove()
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const aspectRatioClass = {
    square: "aspect-square max-h-48",
    portrait: "aspect-[3/4] max-h-56",
    video: "aspect-video max-h-48",
    wide: "aspect-[21/9] max-h-44",
    auto: "min-h-[140px] max-h-60",
  }[aspectRatio]

  const hasImage = Boolean(value && value.trim() && !previewError)

  return (
    <div className={`space-y-2.5 w-full ${className}`}>
      {/* 1. Header: Title and Description stacked at top */}
      {(label || description) && (
        <div className="space-y-0.5">
          {label && <Label className="text-xs font-semibold text-foreground">{label}</Label>}
          {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
        </div>
      )}

      {/* 2. Mode Selector: Full width segmented tabs when no image is loaded */}
      {!hasImage && allowUrlInput && (
        <div className="grid grid-cols-2 w-full bg-muted/60 p-0.5 rounded-lg border text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`py-1.5 rounded-md transition-all text-center cursor-pointer ${
              mode === "upload"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Subir archivo
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`py-1.5 rounded-md transition-all text-center cursor-pointer ${
              mode === "url"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Enlace / URL
          </button>
        </div>
      )}

      {/* 3. Main Body Container with stable height */}
      <div>
        {/* If Image is Active: Show Compact Sleek Preview Box */}
        {hasImage ? (
          <div className="relative w-full rounded-lg border bg-muted/10 overflow-hidden flex flex-col h-28">
            <div className="flex-1 w-full min-h-0 flex items-center justify-center p-2 bg-muted/20 overflow-hidden">
              <img
                src={value}
                alt="Vista previa"
                onError={() => setPreviewError(true)}
                className="max-h-full max-w-full object-contain rounded shadow-xs"
              />
            </div>

            {/* Bottom Bar: Action Buttons without URL */}
            <div className="h-8 shrink-0 flex items-center justify-between w-full px-2.5 bg-background border-t text-xs">
              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                Imagen lista
              </span>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-6 px-2 text-[11px] gap-1 cursor-pointer"
                  disabled={disabled || isUploading}
                >
                  <RefreshCwIcon className="size-3" />
                  Cambiar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleClear}
                  className="h-6 px-2 text-[11px] gap-1 cursor-pointer"
                  disabled={disabled || isUploading}
                >
                  <Trash2Icon className="size-3" />
                  Quitar
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {/* MODE 1: Direct File Upload (Drag & Drop Zone) */}
        {!hasImage && mode === "upload" && (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`h-28 flex flex-col items-center justify-center p-3 border-2 border-dashed rounded-lg text-center transition-all cursor-pointer ${
              isDragging
                ? "border-primary bg-primary/5 ring-2 ring-primary/20 scale-[0.99]"
                : "border-border hover:border-foreground/30 hover:bg-muted/30"
            } ${disabled || isUploading ? "opacity-60 pointer-events-none" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />

            {isUploading ? (
              <div className="flex flex-col items-center gap-1.5">
                <Loader2Icon className="size-4.5 text-muted-foreground animate-spin" />
                <p className="text-xs font-medium text-foreground">Subiendo imagen...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <div className="size-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <UploadCloudIcon className="size-3.5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">
                    <span className="text-primary font-semibold">Hacé clic para explorar</span> o arrastrá tu imagen
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    PNG, JPG, WEBP, SVG o GIF (máx. 10 MB)
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODE 2: Direct URL Input */}
        {!hasImage && mode === "url" && (
          <div className="h-28 flex flex-col items-center justify-center p-3 border rounded-lg bg-muted/20 text-center">
            <div className="w-full max-w-sm space-y-2">
              <div className="relative">
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleUrlApply()
                    }
                  }}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="text-xs h-8 font-mono pr-8 bg-background"
                  disabled={disabled}
                />
                <LinkIcon className="size-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleUrlApply}
                disabled={disabled || !urlInput.trim() || urlInput === value}
                className="w-full text-xs h-7 cursor-pointer"
              >
                Cargar enlace
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
