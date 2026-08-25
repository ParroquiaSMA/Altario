import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  EllipsisVerticalIcon,
} from "lucide-react"
import { getFotos, addFoto, deleteFoto, type FotoItem } from "@/lib/data-store"
import { fetchCatalogFromDb, type CatalogOption } from "@/lib/catalog"
import { ImageUpload } from "@/components/ui/image-upload"

export function GaleriaView() {
  const [fotos, setFotos] = React.useState<FotoItem[]>([])
  const [categoriasCatalogo, setCategoriasCatalogo] = React.useState<CatalogOption[]>([])
  const [searchTerm, setSearchTerm] = React.useState("")
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  const [titulo, setTitulo] = React.useState("")
  const [categoria, setCategoria] = React.useState("templo")
  const [descripcion, setDescripcion] = React.useState("")
  const [imagenUrl, setImagenUrl] = React.useState("/assets/img/fachada.jpg")

  const refresh = React.useCallback(async () => {
    setFotos(getFotos())
    const cats = await fetchCatalogFromDb("categorias_galeria")
    setCategoriasCatalogo(cats.filter((c) => c.activo))
  }, [])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  const filtered = fotos.filter((f) =>
    f.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleOpenNew = async () => {
    const cats = await fetchCatalogFromDb("categorias_galeria")
    const activeCats = cats.filter((c) => c.activo)
    setCategoriasCatalogo(activeCats)

    setTitulo("")
    setCategoria(activeCats[0]?.codigo || "templo")
    setDescripcion("")
    setImagenUrl("/assets/img/fachada.jpg")
    setIsDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!titulo.trim()) return

    const nueva = {
      titulo: titulo.trim(),
      categoria,
      descripcion: descripcion.trim(),
      imagen_url: imagenUrl.trim() || "/assets/img/fachada.jpg",
      es_destacado: false,
      activo: true,
      orden: fotos.length + 1,
    }

    await addFoto(nueva)
    refresh()
    setIsDialogOpen(false)
  }

  const handleDelete = async (id: string) => {
    await deleteFoto(id)
    setFotos((prev) => prev.filter((f) => f.id !== id))
  }

  const getCategoriaLabel = (code: string) => {
    const found = categoriasCatalogo.find((c) => c.codigo === code)
    return found ? found.nombre : code
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 lg:px-6">
        <div className="relative w-full sm:w-80">
          <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar fotos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={handleOpenNew} className="gap-2 w-full sm:w-auto cursor-pointer">
          <PlusIcon className="size-4" />
          Subir Foto
        </Button>
      </div>

      {/* Grid of Photo Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-4 lg:px-6">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-16 text-xs text-muted-foreground">
            No se encontraron fotos.
          </div>
        ) : (
          filtered.map((f) => (
            <div
              key={f.id}
              className="group rounded-md border border-border bg-card overflow-hidden hover:border-foreground/40 transition-colors flex flex-col justify-between"
            >
              <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                <img
                  src={f.imagen_url || "/assets/img/fachada.jpg"}
                  alt={f.titulo}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] bg-background/90 text-foreground border border-border/80 capitalize font-medium">
                  {getCategoriaLabel(f.categoria)}
                </span>
              </div>
              <div className="p-3 flex items-start justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-foreground truncate">{f.titulo}</span>
                  {f.descripcion && (
                    <span className="text-[11px] text-muted-foreground truncate">{f.descripcion}</span>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button variant="ghost" size="icon" className="size-6 text-muted-foreground data-open:bg-muted shrink-0 cursor-pointer" />}
                  >
                    <EllipsisVerticalIcon className="size-3.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="text-xs w-32">
                    <DropdownMenuItem
                      variant="destructive"
                      className="cursor-pointer"
                      onClick={() => handleDelete(f.id)}
                    >
                      <Trash2Icon />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Subir Foto a la Galería</DialogTitle>
            <DialogDescription className="text-xs">
              Subida de imágenes para la web pública.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Título</Label>
              <Input
                placeholder="Ej: Retablo Mayor"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="text-xs h-8"
              />
            </div>

            {/* Dynamic Select from 'categorias_galeria' catalog table */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Categoría</Label>
              <Select value={categoria} onValueChange={(val) => { if (val) setCategoria(val) }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  {categoriasCatalogo.length === 0 ? (
                    <SelectItem value="templo">El Templo</SelectItem>
                  ) : (
                    categoriasCatalogo.map((c) => (
                      <SelectItem key={c.id} value={c.codigo}>
                        {c.nombre}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <ImageUpload
                value={imagenUrl}
                onChange={setImagenUrl}
                folder="galeria"
                label="Fotografía del templo o celebración"
                description="Subí una foto o ingresá un enlace directo."
                aspectRatio="video"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Descripción</Label>
              <Input
                placeholder="Descripción breve..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="text-xs h-8"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t mt-2">
              <Button type="button" variant="outline" size="sm" className="text-xs cursor-pointer" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="text-xs bg-foreground text-background hover:bg-foreground/90 cursor-pointer">
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
