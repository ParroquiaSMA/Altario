"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ImageUpload } from "@/components/ui/image-upload"
import {
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  Edit3Icon,
  EllipsisVerticalIcon,
  ArrowLeftIcon,
  SaveIcon,
  BoldIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  LinkIcon,
  ImageIcon,
  Loader2Icon,
  FileTextIcon,
  ExternalLinkIcon,
} from "lucide-react"
import {
  fetchBlogFromDb,
  addBlogPost,
  updateBlogPost,
  deleteBlogPost,
  type BlogItem,
} from "@/lib/data-store"
import { uploadMediaFile } from "@/lib/storage"
import { marked } from "marked"

const CATEGORIAS_COMUNES = [
  { value: "general", label: "General" },
  { value: "celebraciones", label: "Celebraciones" },
  { value: "formacion", label: "Formación" },
  { value: "solidaridad", label: "Solidaridad" },
  { value: "comunidad", label: "Comunidad" },
  { value: "sacramentos", label: "Sacramentos" },
]

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function BlogView() {
  // Navigation State: "list" or "editor"
  const [viewMode, setViewMode] = React.useState<"list" | "editor">("list")
  const [editingItem, setEditingItem] = React.useState<BlogItem | null>(null)

  // Posts State (Loaded directly from Supabase DB)
  const [posts, setPosts] = React.useState<BlogItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")

  // Form Fields State
  const [titulo, setTitulo] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false)
  const [extracto, setExtracto] = React.useState("")
  const [contenidoHtml, setContenidoHtml] = React.useState("")
  const [imagenUrl, setImagenUrl] = React.useState("")
  const [autor, setAutor] = React.useState("Secretaría Parroquial")
  const [categoria, setCategoria] = React.useState("general")
  const [publicado, setPublicado] = React.useState(true)
  const [fechaPublicacion, setFechaPublicacion] = React.useState("")
  const [orden, setOrden] = React.useState(1)
  const [isSaving, setIsSaving] = React.useState(false)

  // Editor mode: "visual" | "markdown" | "preview"
  const [editorTab, setEditorTab] = React.useState<"visual" | "markdown" | "preview">("visual")
  const editorRef = React.useRef<HTMLDivElement | null>(null)
  const isEditingContentRef = React.useRef(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [isUploadingImage, setIsUploadingImage] = React.useState(false)

  const refresh = React.useCallback(async () => {
    try {
      setLoading(true)
      const items = await fetchBlogFromDb()
      setPosts(items || [])
    } catch (err) {
      console.warn("[Blog] Error fetching:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  // Sync content into visual WYSIWYG editor
  React.useEffect(() => {
    if (viewMode === "editor" && editorTab === "visual" && editorRef.current && !isEditingContentRef.current) {
      if (editorRef.current.innerHTML !== contenidoHtml) {
        editorRef.current.innerHTML = contenidoHtml
      }
    }
  }, [viewMode, editorTab, contenidoHtml])

  const filtered = posts.filter((post) => {
    const term = searchTerm.toLowerCase()
    return (
      post.titulo?.toLowerCase().includes(term) ||
      post.extracto?.toLowerCase().includes(term) ||
      post.categoria?.toLowerCase().includes(term) ||
      post.autor?.toLowerCase().includes(term)
    )
  })

  // Open Full-Page Editor for New Article
  const handleOpenNew = () => {
    setEditingItem(null)
    setTitulo("")
    setSlug("")
    setSlugManuallyEdited(false)
    setExtracto("")
    setContenidoHtml("<p>Escribí aquí el contenido del artículo...</p>")
    setImagenUrl("")
    setAutor("Secretaría Parroquial")
    setCategoria("general")
    setPublicado(true)
    setFechaPublicacion(new Date().toISOString().split("T")[0])
    setOrden((posts.length || 0) + 1)
    setEditorTab("visual")
    setViewMode("editor")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Open Full-Page Editor for Editing Existing Article
  const handleEdit = (item: BlogItem) => {
    setEditingItem(item)
    setTitulo(item.titulo || "")
    setSlug(item.slug || "")
    setSlugManuallyEdited(true)
    setExtracto(item.extracto || "")
    
    // Normalize content to HTML for visual editor
    const raw = item.contenido || ""
    const isHtml = /<[a-z][\s\S]*>/i.test(raw)
    const initialHtml = isHtml ? raw : (marked.parse(raw) as string) || ""
    setContenidoHtml(initialHtml)

    setImagenUrl(item.imagen_url || "")
    setAutor(item.autor || "Secretaría Parroquial")
    setCategoria(item.categoria || "general")
    setPublicado(item.publicado ?? true)
    setFechaPublicacion(item.fecha_publicacion || new Date().toISOString().split("T")[0])
    setOrden(item.orden ?? 1)
    setEditorTab("visual")
    setViewMode("editor")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleTituloChange = (val: string) => {
    setTitulo(val)
    if (!slugManuallyEdited) {
      setSlug(slugify(val))
    }
  }

  // Editor Input Handlers
  const handleEditorInput = () => {
    if (!editorRef.current) return
    isEditingContentRef.current = true
    const html = editorRef.current.innerHTML
    setContenidoHtml(html)
    setTimeout(() => {
      isEditingContentRef.current = false
    }, 200)
  }

  const formatText = (command: string, value: string | undefined = undefined) => {
    if (!editorRef.current) return
    editorRef.current.focus()
    document.execCommand(command, false, value)
    handleEditorInput()
  }

  const handleInsertLink = () => {
    const url = prompt("Ingresá la URL del enlace:", "https://")
    if (url) {
      formatText("createLink", url)
    }
  }

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingImage(true)
    try {
      const url = await uploadMediaFile(file, "general")
      formatText("insertImage", url)
    } catch (err) {
      console.error("Error al subir imagen:", err)
      alert("Error al subir la imagen. Por favor probá de nuevo.")
    } finally {
      setIsUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleInsertImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleEditorPaste = async (e: React.ClipboardEvent) => {
    const file = e.clipboardData.files?.[0]
    if (file && file.type.startsWith("image/")) {
      e.preventDefault()
      setIsUploadingImage(true)
      try {
        const url = await uploadMediaFile(file, "general")
        formatText("insertImage", url)
      } catch (err) {
        console.error("Error al pegar imagen:", err)
      } finally {
        setIsUploadingImage(false)
      }
    }
  }

  const handleEditorDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setIsUploadingImage(true)
      try {
        const url = await uploadMediaFile(file, "general")
        formatText("insertImage", url)
      } catch (err) {
        console.error("Error al soltar imagen:", err)
      } finally {
        setIsUploadingImage(false)
      }
    }
  }

  // Save Article
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!titulo.trim()) {
      alert("Por favor ingresá un título para el artículo.")
      return
    }
    const finalSlug = (slug || slugify(titulo)).trim()
    if (!finalSlug) {
      alert("Por favor ingresá un slug válido.")
      return
    }

    // Get current HTML from editor if currently in visual tab
    let finalContent = contenidoHtml
    if (editorTab === "visual" && editorRef.current) {
      finalContent = editorRef.current.innerHTML
    }

    setIsSaving(true)
    try {
      const payload = {
        titulo: titulo.trim(),
        slug: finalSlug,
        extracto: extracto.trim(),
        contenido: finalContent.trim(),
        imagen_url: imagenUrl.trim() || null,
        autor: autor.trim() || "Secretaría Parroquial",
        categoria: categoria.trim() || "general",
        publicado,
        fecha_publicacion: fechaPublicacion || null,
        orden: Number(orden) || 1,
      }

      if (editingItem) {
        await updateBlogPost(editingItem.id, payload)
      } else {
        await addBlogPost(payload)
      }

      await refresh()
      setViewMode("list")
    } catch (err: any) {
      console.error("[Blog] Error al guardar:", err)
      alert("Error al guardar el artículo: " + (err.message || err))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!confirm("¿Seguro que deseas eliminar este artículo del blog?")) return
    try {
      await deleteBlogPost(id)
      setPosts((prev) => prev.filter((p) => p.id !== id))
      if (editingItem?.id === id) {
        setViewMode("list")
      }
    } catch (err: any) {
      console.error("[Blog] Error al eliminar:", err)
      alert("Error al eliminar el artículo: " + (err.message || err))
    }
  }

  // ==========================================
  // FULL PAGE EDITOR VIEW
  // ==========================================
  if (viewMode === "editor") {
    return (
      <div className="flex flex-col gap-6 py-4 md:py-6">
        {/* Top Sticky Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 lg:px-6 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setViewMode("list")}
              className="gap-1.5 cursor-pointer"
            >
              <ArrowLeftIcon className="size-4" />
              <span>Volver</span>
            </Button>
            <div>
              <div className="text-xs text-muted-foreground">
                Blog / {editingItem ? "Editar Publicación" : "Nueva Publicación"}
              </div>
              <h2 className="text-base font-semibold text-foreground truncate max-w-md">
                {titulo || (editingItem ? "Editar Artículo" : "Sin Título")}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {publicado ? (
              <Badge variant="outline" className="gap-1.5 text-emerald-600 border-emerald-300">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Publicado
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1.5 text-amber-600 border-amber-300">
                <span className="size-1.5 rounded-full bg-amber-500" />
                Borrador
              </Badge>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("list")}
              className="cursor-pointer"
              disabled={isSaving}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="gap-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <SaveIcon className="size-4" />
                  <span>{editingItem ? "Guardar Cambios" : "Publicar Artículo"}</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4 lg:px-6">
          {/* Main Content Column (70%) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Title & Excerpt Container */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="post-titulo" className="text-xs font-semibold">
                  Título de la Publicación *
                </Label>
                <Input
                  id="post-titulo"
                  placeholder="Ej: Fiesta Patronal 2026: una celebración de toda la comunidad"
                  value={titulo}
                  onChange={(e) => handleTituloChange(e.target.value)}
                  className="text-base font-semibold tracking-tight"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="post-extracto" className="text-xs font-semibold">
                  Extracto / Resumen Breve *
                </Label>
                <Textarea
                  id="post-extracto"
                  placeholder="Escribí una o dos oraciones que resuman la publicación para la tarjeta en la web..."
                  rows={2}
                  value={extracto}
                  onChange={(e) => setExtracto(e.target.value)}
                  className="text-sm text-muted-foreground leading-relaxed resize-none"
                />
              </div>
            </div>

            {/* Rich Editor Container (Same as "Historia") */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                <div>
                  <Label className="text-xs font-semibold">Contenido Principal</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Podés redactar con títulos, párrafos, citas y fotos subidas directamente.
                  </p>
                </div>

                {/* Editor Mode Tabs */}
                <div className="flex items-center gap-1 rounded-md border border-border p-0.5 bg-muted/30 text-xs">
                  <button
                    type="button"
                    onClick={() => setEditorTab("visual")}
                    className={`px-2.5 py-1 rounded-sm font-medium transition-colors cursor-pointer ${
                      editorTab === "visual"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Visual
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorTab("markdown")}
                    className={`px-2.5 py-1 rounded-sm font-medium transition-colors cursor-pointer ${
                      editorTab === "markdown"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Código
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorTab("preview")}
                    className={`px-2.5 py-1 rounded-sm font-medium transition-colors cursor-pointer ${
                      editorTab === "preview"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Vista Previa
                  </button>
                </div>
              </div>

              {/* VISUAL WYSIWYG MODE */}
              {editorTab === "visual" && (
                <div className="space-y-3">
                  {/* Formatting Toolbar */}
                  <div className="flex flex-wrap items-center gap-1 p-1 rounded-md bg-muted/40 border border-border">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => formatText("formatBlock", "<h2>")}
                      className="h-7 px-2 text-xs font-bold"
                      title="Título H2"
                    >
                      H2
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => formatText("formatBlock", "<h3>")}
                      className="h-7 px-2 text-xs font-bold"
                      title="Subtítulo H3"
                    >
                      H3
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => formatText("formatBlock", "<p>")}
                      className="h-7 px-2 text-xs font-medium text-muted-foreground"
                      title="Párrafo normal"
                    >
                      Párrafo
                    </Button>
                    <div className="w-[1px] h-4 bg-border mx-0.5" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => formatText("bold")}
                      className="h-7 px-2"
                      title="Negrita"
                    >
                      <BoldIcon className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => formatText("italic")}
                      className="h-7 px-2"
                      title="Cursiva"
                    >
                      <ItalicIcon className="size-3.5" />
                    </Button>
                    <div className="w-[1px] h-4 bg-border mx-0.5" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => formatText("insertUnorderedList")}
                      className="h-7 px-2"
                      title="Lista de viñetas"
                    >
                      <ListIcon className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => formatText("insertOrderedList")}
                      className="h-7 px-2"
                      title="Lista numerada"
                    >
                      <ListOrderedIcon className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => formatText("formatBlock", "<blockquote>")}
                      className="h-7 px-2"
                      title="Cita destacada"
                    >
                      <QuoteIcon className="size-3.5" />
                    </Button>
                    <div className="w-[1px] h-4 bg-border mx-0.5" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleInsertLink}
                      className="h-7 px-2"
                      title="Insertar enlace"
                    >
                      <LinkIcon className="size-3.5" />
                    </Button>

                    {/* Direct Media Upload */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleInsertImageClick}
                      disabled={isUploadingImage}
                      className="h-7 px-2 gap-1.5 text-xs cursor-pointer text-muted-foreground hover:text-foreground"
                      title="Subir foto al texto"
                    >
                      {isUploadingImage ? (
                        <>
                          <Loader2Icon className="size-3.5 animate-spin text-primary" />
                          <span className="text-primary font-medium">Subiendo...</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="size-3.5" />
                          <span>Subir imagen</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Contenteditable Canvas */}
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleEditorInput}
                    onPaste={handleEditorPaste}
                    onDrop={handleEditorDrop}
                    className="min-h-[420px] max-h-[680px] overflow-y-auto p-4 rounded-md border border-border bg-background text-foreground text-sm space-y-3 focus:outline-none focus:ring-1 focus:ring-ring leading-relaxed [&>h2]:text-lg [&>h2]:font-bold [&>h2]:mt-5 [&>h2]:text-primary [&>h3]:text-base [&>h3]:font-semibold [&>h3]:mt-4 [&>p]:text-foreground [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-1 [&>blockquote]:border-l-4 [&>blockquote]:border-primary/60 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-muted-foreground [&>blockquote]:my-3 [&>img]:rounded-md [&>img]:border [&>img]:my-3 [&>img]:max-h-80 [&>img]:object-cover [&>a]:text-primary [&>a]:underline"
                  />
                </div>
              )}

              {/* RAW MARKDOWN / CODE MODE */}
              {editorTab === "markdown" && (
                <div className="space-y-2">
                  <Textarea
                    rows={18}
                    value={contenidoHtml}
                    onChange={(e) => setContenidoHtml(e.target.value)}
                    placeholder="Escribí aquí contenido HTML o Markdown..."
                    className="text-sm leading-relaxed"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Editando código directamente. Al cambiar a modo Visual o Vista Previa se sincronizará automáticamente.
                  </p>
                </div>
              )}

              {/* LIVE PREVIEW MODE */}
              {editorTab === "preview" && (
                <div className="min-h-[420px] max-h-[680px] overflow-y-auto p-5 rounded-md border border-border bg-muted/10 space-y-4">
                  <div className="border-b border-border pb-3">
                    <Badge variant="outline" className="capitalize text-xs mb-2">
                      {categoria || "general"}
                    </Badge>
                    <h1 className="text-2xl font-bold text-foreground">
                      {titulo || "Sin título"}
                    </h1>
                    {extracto && (
                      <p className="text-sm text-muted-foreground mt-1.5 italic">
                        {extracto}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground mt-2">
                      {fechaPublicacion} · {autor}
                    </div>
                  </div>

                  <div
                    className="text-sm text-foreground space-y-3 leading-relaxed [&>h2]:text-lg [&>h2]:font-bold [&>h2]:mt-4 [&>h2]:text-primary [&>h3]:text-base [&>h3]:font-semibold [&>h3]:mt-3 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>blockquote]:border-l-4 [&>blockquote]:border-primary/60 [&>blockquote]:pl-4 [&>blockquote]:italic [&>img]:rounded-md [&>img]:my-3 [&>img]:max-h-80 [&>img]:object-cover"
                    dangerouslySetInnerHTML={{
                      __html: /<[a-z][\s\S]*>/i.test(contenidoHtml)
                        ? contenidoHtml
                        : (marked.parse(contenidoHtml || "") as string),
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Settings Column (30%) */}
          <div className="space-y-5">
            {/* Publication Settings */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              <div className="font-semibold text-xs text-foreground uppercase tracking-wider border-b border-border pb-2">
                Publicación
              </div>

              {/* Publicado Checkbox */}
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20">
                <input
                  id="post-publicado-check"
                  type="checkbox"
                  checked={publicado}
                  onChange={(e) => setPublicado(e.target.checked)}
                  className="size-4 mt-0.5 rounded border-input text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="post-publicado-check" className="cursor-pointer select-none">
                  <span className="text-xs font-semibold text-foreground block">
                    Publicar en la web
                  </span>
                  <span className="text-[11px] text-muted-foreground block leading-snug">
                    {publicado
                      ? "Visible para los visitantes en la web y portada."
                      : "Guardado como borrador privado (no visible)."}
                  </span>
                </label>
              </div>

              {/* Fecha */}
              <div className="space-y-1.5">
                <Label htmlFor="post-fecha" className="text-xs font-semibold">
                  Fecha de Publicación
                </Label>
                <Input
                  id="post-fecha"
                  type="date"
                  value={fechaPublicacion}
                  onChange={(e) => setFechaPublicacion(e.target.value)}
                />
              </div>

              {/* Autor */}
              <div className="space-y-1.5">
                <Label htmlFor="post-autor" className="text-xs font-semibold">
                  Autor / Firma
                </Label>
                <Input
                  id="post-autor"
                  placeholder="Ej: Secretaría Parroquial"
                  value={autor}
                  onChange={(e) => setAutor(e.target.value)}
                />
              </div>

              {/* Orden */}
              <div className="space-y-1.5">
                <Label htmlFor="post-orden" className="text-xs font-semibold">
                  Orden de Visualización
                </Label>
                <Input
                  id="post-orden"
                  type="number"
                  min={1}
                  value={orden}
                  onChange={(e) => setOrden(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Organization & URL */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              <div className="font-semibold text-xs text-foreground uppercase tracking-wider border-b border-border pb-2">
                Enlace y Categoría
              </div>

              {/* Slug */}
              <div className="space-y-1.5">
                <Label htmlFor="post-slug" className="text-xs font-semibold">
                  Enlace permanente (Slug) *
                </Label>
                <Input
                  id="post-slug"
                  placeholder="fiesta-patronal-2026"
                  value={slug}
                  onChange={(e) => {
                    setSlugManuallyEdited(true)
                    setSlug(slugify(e.target.value))
                  }}
                />
                <div className="text-[11px] text-muted-foreground truncate">
                  web: /blog/{slug || "..."}
                </div>
              </div>

              {/* Categoría */}
              <div className="space-y-1.5">
                <Label htmlFor="post-categoria" className="text-xs font-semibold">
                  Categoría
                </Label>
                <Input
                  id="post-categoria"
                  placeholder="general, celebraciones..."
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                />
                <div className="flex flex-wrap gap-1 mt-1">
                  {CATEGORIAS_COMUNES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategoria(cat.value)}
                      className={`text-[11px] px-2 py-0.5 rounded cursor-pointer border border-border ${
                        categoria.toLowerCase() === cat.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Cover Image */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="font-semibold text-xs text-foreground uppercase tracking-wider border-b border-border pb-2">
                Foto de Portada
              </div>
              <ImageUpload
                value={imagenUrl}
                onChange={setImagenUrl}
                folder="general"
                label="Cabecera del artículo"
                description="Subí la foto que se mostrará en el encabezado y en la tarjeta."
                aspectRatio="wide"
              />
            </div>

            {/* Danger / Action Zone */}
            {editingItem && (
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(editingItem.id)}
                  className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30 cursor-pointer gap-2"
                >
                  <Trash2Icon className="size-4" />
                  Eliminar este artículo
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // LIST VIEW
  // ==========================================
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 lg:px-6">
        <div className="relative w-full sm:w-80">
          <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar artículos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={handleOpenNew} className="gap-2 w-full sm:w-auto cursor-pointer">
          <PlusIcon className="size-4" />
          Nuevo Artículo
        </Button>
      </div>

      {/* Table Container */}
      <div className="px-4 lg:px-6">
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Cargando artículos...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FileTextIcon className="size-10 mx-auto text-muted-foreground/40" />
              <div className="text-sm font-medium text-foreground">No se encontraron artículos</div>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {searchTerm
                  ? "Probá con otra búsqueda o limpiá el filtro."
                  : "Creá la primera publicación para el blog o las novedades parroquiales."}
              </p>
              <Button onClick={handleOpenNew} variant="outline" size="sm" className="gap-1.5 cursor-pointer mt-2">
                <PlusIcon className="size-3.5" />
                Crear Artículo
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="w-16 px-4">Portada</TableHead>
                      <TableHead className="px-4">Título y Resumen</TableHead>
                      <TableHead className="px-4">Categoría</TableHead>
                      <TableHead className="px-4">Fecha</TableHead>
                      <TableHead className="px-4">Estado</TableHead>
                      <TableHead className="text-right px-4">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item) => (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer hover:bg-muted/40 transition-colors"
                        onClick={() => handleEdit(item)}
                      >
                        {/* Thumbnail */}
                        <TableCell className="px-4 py-3">
                          <div className="size-12 rounded-md bg-muted border border-border overflow-hidden flex items-center justify-center shrink-0">
                            {item.imagen_url ? (
                              <img
                                src={item.imagen_url}
                                alt={item.titulo}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none"
                                }}
                              />
                            ) : (
                              <FileTextIcon className="size-5 text-muted-foreground/60" />
                            )}
                          </div>
                        </TableCell>

                        {/* Title & Excerpt */}
                        <TableCell className="px-4 py-3 max-w-md">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-sm text-foreground line-clamp-1">
                              {item.titulo}
                            </span>
                            {item.extracto && (
                              <span className="text-xs text-muted-foreground line-clamp-1">
                                {item.extracto}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Category */}
                        <TableCell className="px-4 py-3 whitespace-nowrap">
                          <Badge variant="secondary" className="capitalize text-xs font-normal">
                            {item.categoria || "general"}
                          </Badge>
                        </TableCell>

                        {/* Date */}
                        <TableCell className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                          {item.fecha_publicacion || "-"}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="px-4 py-3 whitespace-nowrap">
                          {item.publicado ? (
                            <Badge variant="outline" className="gap-1.5 text-emerald-600 border-emerald-300">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              Publicado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1.5 text-amber-600 border-amber-300">
                              <span className="size-1.5 rounded-full bg-amber-500" />
                              Borrador
                            </Badge>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
                              onClick={() => handleEdit(item)}
                              title="Editar"
                            >
                              <Edit3Icon className="size-4" />
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-muted-foreground data-open:bg-muted cursor-pointer"
                                  />
                                }
                              >
                                <EllipsisVerticalIcon className="size-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36">
                                <DropdownMenuItem className="cursor-pointer" onClick={() => handleEdit(item)}>
                                  <Edit3Icon className="size-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                {item.slug && item.publicado && (
                                  <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() => window.open(`/blog/${item.slug}`, "_blank")}
                                  >
                                    <ExternalLinkIcon className="size-4 mr-2" />
                                    Ver en web
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="cursor-pointer text-destructive focus:text-destructive"
                                  onClick={(e) => handleDelete(item.id, e)}
                                >
                                  <Trash2Icon className="size-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card List */}
              <div className="md:hidden divide-y divide-border">
                {filtered.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 space-y-2 cursor-pointer hover:bg-muted/30"
                    onClick={() => handleEdit(item)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-sm text-foreground">{item.titulo}</div>
                      <Badge variant="outline" className="text-[11px] shrink-0">
                        {item.categoria || "general"}
                      </Badge>
                    </div>

                    {item.extracto && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.extracto}</p>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      <span>{item.fecha_publicacion || "-"}</span>
                      <span>{item.publicado ? "Publicado" : "Borrador"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
