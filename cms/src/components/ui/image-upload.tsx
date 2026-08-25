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
  ImageIcon,
  CheckIcon,
  Loader2Icon,
  RefreshCwIcon,
} from "lucide-react"

export interface PresetItem {
  label: string
  url: string
}

export interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onRemove?: () => void
  label?: string
  description?: string
  folder?: "logos" | "parroco" | "galeria" | "general"
  aspectRatio?: "square" | "portrait" | "video" | "wide" | "auto"
  allowUrlInput?: boolean
  allowPresetSelection?: boolean
  presets?: PresetItem[]
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
  allowPresetSelection = true,
  presets = [
    { label: "Fachada del templo", url: "/assets/img/fachada.jpg" },
    { label: "Imagen patrona", url: "/assets/img/patrona.jpg" },
    { label: "Portal de entrada", url: "/assets/img/portal.jpg" },
    { label: "Nave central", url: "/assets/img/nave.jpg" },
    { label: "Rosetón histórico", url: "/assets/img/roseton.jpg" },
    { label: "Altar mayor", url: "/assets/img/altar.jpg" },
  ],
  className = "",
  disabled = false,
}: ImageUploadProps) {
  const [mode, setMode] = React.useState<"upload" | "url" | "presets">("upload")
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
      {/* Header Label and mode buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <div>
          {label && <Label className="text-xs font-semibold text-foreground">{label}</Label>}
          {description && <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>}
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-md border text-[11px] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`px-2 py-0.5 rounded transition-colors cursor-pointer font-medium ${
              mode === "upload" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Subir archivo
          </button>
          {allowUrlInput && (
            <button
              type="button"
              onClick={() => setMode("url")}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer font-medium ${
                mode === "url" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Enlace / URL
            </button>
          )}
          {allowPresetSelection && presets.length > 0 && (
            <button
              type="button"
              onClick={() => setMode("presets")}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer font-medium ${
                mode === "presets" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Biblioteca
            </button>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="space-y-3">
        {/* If Image is Active: Show Sleek Preview Box */}
        {hasImage ? (
          <div className="relative rounded-lg border bg-muted/20 overflow-hidden group">
            <div className={`flex items-center justify-center w-full p-2 bg-checkerboard ${aspectRatioClass}`}>
              <img
                src={value}
                alt="Vista previa"
                onError={() => setPreviewError(true)}
                className="max-h-full max-w-full object-contain rounded shadow-xs transition-transform group-hover:scale-[1.01]"
              />
            </div>

            {/* Overlay Bar with Actions */}
            <div className="flex items-center justify-between px-3 py-2 bg-background/95 backdrop-blur-xs border-t text-xs">
              <div className="flex items-center gap-2 truncate pr-2">
                <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate text-muted-foreground font-mono text-[11px] select-all">
                  {value.startsWith("data:") ? "Imagen local cargada" : value}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-7 px-2 text-[11px] gap-1 cursor-pointer"
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
                  className="h-7 px-2 text-[11px] gap-1 cursor-pointer"
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
        {mode === "upload" && (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg text-center transition-all cursor-pointer ${
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
              <div className="flex flex-col items-center gap-2 py-2">
                <Loader2Icon className="size-7 text-primary animate-spin" />
                <p className="text-xs font-medium text-foreground">Subiendo imagen a Supabase Storage...</p>
                <p className="text-[11px] text-muted-foreground">Optimizando y generando URL pública</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:text-foreground">
                  <UploadCloudIcon className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">
                    <span className="text-primary font-semibold">Hacé clic para explorar</span> o arrastrá tu imagen acá
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    PNG, JPG, WEBP, SVG o GIF (máx. 10 MB)
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODE 2: Direct URL Input */}
        {mode === "url" && (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleUrlApply()
                  }
                }}
                placeholder="https://ejemplo.com/imagen.jpg o /assets/img/..."
                className="text-xs h-9 font-mono pr-8"
                disabled={disabled}
              />
              <LinkIcon className="size-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleUrlApply}
              disabled={disabled || !urlInput.trim() || urlInput === value}
              className="text-xs h-9 cursor-pointer"
            >
              Aplicar
            </Button>
          </div>
        )}

        {/* MODE 3: Preset Library Picker */}
        {mode === "presets" && allowPresetSelection && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border rounded-lg p-2.5 bg-muted/20">
            {presets.map((preset, idx) => {
              const isSelected = value === preset.url
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onChange(preset.url)}
                  className={`group flex items-center gap-2 p-1.5 rounded-md border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border hover:bg-background bg-card"
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    className="size-8 rounded object-cover border shrink-0 bg-muted"
                  />
                  <div className="truncate flex-1">
                    <p className="text-[11px] font-medium text-foreground truncate">{preset.label}</p>
                    <p className="text-[9px] text-muted-foreground font-mono truncate">{preset.url}</p>
                  </div>
                  {isSelected && <CheckIcon className="size-3 text-primary shrink-0 mr-1" />}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
