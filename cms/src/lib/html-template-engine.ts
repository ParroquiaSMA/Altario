/**
 * Motor de plantillas HTML para el módulo de Contenido.
 * - Interpolación de variables {{key}} en HTML/CSS
 * - Extracción automática de variables desde HTML
 * - Renderizado a PNG de alta resolución
 */

export interface VariableDefinicion {
  key: string
  label: string
  tipo: "text" | "textarea" | "select" | "color" | "image" | "date" | "number"
  opciones?: string[]
  default_val?: string
  placeholder?: string
  ayuda?: string
}

export interface PlantillaContenido {
  id: string
  slug: string
  nombre: string
  descripcion?: string
  categoria: string
  ancho_base: number
  alto_base: number
  html_template: string
  variables: VariableDefinicion[]
  activo: boolean
  orden: number
}

/**
 * Extrae las variables {{key}} del HTML template.
 * Devuelve un Set de keys únicos.
 */
export function extractVariables(html: string): string[] {
  const regex = /\{\{(\w+)\}\}/g
  const keys = new Set<string>()
  let match: RegExpExecArray | null
  while ((match = regex.exec(html)) !== null) {
    keys.add(match[1])
  }
  return Array.from(keys)
}

/**
 * Interpola un HTML template reemplazando {{key}} por los valores proporcionados.
 */
export function renderTemplate(
  htmlTemplate: string,
  values: Record<string, string>
): string {
  return htmlTemplate.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return values[key] ?? ""
  })
}

/**
 * Genera los valores por defecto a partir de las variables de una plantilla.
 */
export function getDefaultValues(
  variables: VariableDefinicion[]
): Record<string, string> {
  const values: Record<string, string> = {}
  for (const v of variables) {
    values[v.key] = v.default_val ?? ""
  }
  return values
}

/**
 * Renderiza un HTML template a un canvas y exporta como PNG Blob.
 * Usa un iframe oculto para renderizar el HTML con sus estilos aislados.
 */
export async function renderToPng(
  htmlTemplate: string,
  values: Record<string, string>,
  width: number,
  height: number
): Promise<Blob> {
  const html = renderTemplate(htmlTemplate, values)

  // Crear un contenedor offscreen
  const container = document.createElement("div")
  container.style.position = "fixed"
  container.style.left = "-99999px"
  container.style.top = "-99999px"
  container.style.width = `${width}px`
  container.style.height = `${height}px`
  container.style.overflow = "hidden"
  document.body.appendChild(container)

  // Crear un iframe aislado para renderizar
  const iframe = document.createElement("iframe")
  iframe.style.width = `${width}px`
  iframe.style.height = `${height}px`
  iframe.style.border = "none"
  iframe.style.overflow = "hidden"
  container.appendChild(iframe)

  await new Promise<void>((resolve) => {
    iframe.onload = () => resolve()
    iframe.srcdoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
<style>
html, body { margin: 0; padding: 0; width: ${width}px; height: ${height}px; overflow: hidden; }
</style>
</head>
<body>${html}</body>
</html>`
  })

  // Esperar a que las fuentes carguen en el iframe
  try {
    await iframe.contentDocument?.fonts?.ready
  } catch {
    // Fallback: esperar un poco
    await new Promise((r) => setTimeout(r, 500))
  }

  // Usar html2canvas-like approach con Canvas API
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")!

  // Serializar el contenido del iframe a SVG foreignObject
  const svgData = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">
          ${iframe.contentDocument?.documentElement?.outerHTML || html}
        </div>
      </foreignObject>
    </svg>`

  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
  const url = URL.createObjectURL(svgBlob)

  try {
    const img = new Image()
    img.crossOrigin = "anonymous"
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
      img.src = url
    })
    ctx.drawImage(img, 0, 0, width, height)
  } finally {
    URL.revokeObjectURL(url)
  }

  // Cleanup
  document.body.removeChild(container)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error("No se pudo generar la imagen"))
      },
      "image/png",
      1.0
    )
  })
}

/**
 * Descarga un Blob como archivo.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

/**
 * Genera un nombre de archivo limpio a partir de un texto.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
}
