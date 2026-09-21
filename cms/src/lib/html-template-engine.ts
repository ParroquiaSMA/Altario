/**
 * Motor de plantillas HTML para el módulo de Contenido.
 * - 100% basado en base de datos (html_template y variables)
 * - Cero hardcoding de plantillas en código TypeScript
 * - Renderizado fiel de HTML/CSS con soporte SVG y Google Fonts
 * - Exportación de alta resolución a PNG
 */

export interface VariableDefinicion {
  key: string
  label: string
  tipo: "text" | "textarea" | "select" | "color" | "image" | "date" | "number"
  opciones?: string[]
  default_val?: string
  placeholder?: string
  ayuda?: string
  instruccion?: string
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

export const PALETAS: Record<
  string,
  { nombre: string; fondo: string; titulo: string; texto: string; acento: string; claro: boolean }
> = {
  lapis: {
    nombre: "Azul",
    fondo: "#16244A",
    titulo: "#FFFFFF",
    texto: "rgba(255,255,255,0.80)",
    acento: "#C9A96A",
    claro: false,
  },
  papel: {
    nombre: "Papel",
    fondo: "#FBF9F4",
    titulo: "#16244A",
    texto: "#5B6272",
    acento: "#B08D49",
    claro: true,
  },
  crema: {
    nombre: "Crema",
    fondo: "#F1E7D6",
    titulo: "#16244A",
    texto: "#5B6272",
    acento: "#A8823D",
    claro: true,
  },
  noche: {
    nombre: "Noche",
    fondo: "#0E1730",
    titulo: "#E3D2AE",
    texto: "rgba(255,255,255,0.76)",
    acento: "#C9A96A",
    claro: false,
  },
}

/**
 * Extrae las variables {{key}} del HTML template.
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
 * Formatea el texto plano de `lista` (separado por saltos de línea y pipes)
 * en elementos HTML según las clases y estructura que define la plantilla.
 */
export function formatListToHtml(htmlTemplate: string, rawList: string): string {
  if (!rawList) return ""
  const lines = rawList.split("\n").map((l) => l.trim()).filter(Boolean)

  if (htmlTemplate.includes("tabla-horarios") || htmlTemplate.includes("fila-horario")) {
    return lines
      .map((line) => {
        const [dia, hora] = line.split("|").map((s) => s?.trim() || "")
        return `<div class="fila-horario"><span class="fila-dia">${dia || line}</span><span class="fila-hora">${hora || ""}</span></div>`
      })
      .join("\n")
  }

  if (htmlTemplate.includes("item-fiesta") || htmlTemplate.includes("lista-items")) {
    return lines
      .map((line) => {
        const [hora, texto] = line.split("|").map((s) => s?.trim() || "")
        return `<div class="item-fiesta"><span class="item-hora">${hora || ""}</span><span class="item-texto">${texto || line}</span></div>`
      })
      .join("\n")
  }

  if (htmlTemplate.includes("req-item") || htmlTemplate.includes("lista-req")) {
    return lines
      .map((line) => {
        return `<div class="req-item"><div class="req-dot"></div><span class="req-texto">${line}</span></div>`
      })
      .join("\n")
  }

  if (htmlTemplate.includes("item-ped") || htmlTemplate.includes("lista-pedidos")) {
    return lines
      .map((line) => {
        return `<div class="item-ped"><span class="punto-ped">·</span><span class="texto-ped">${line}</span></div>`
      })
      .join("\n")
  }

  if (htmlTemplate.includes("evento-item") || htmlTemplate.includes("eventos-lista")) {
    return lines
      .map((line) => {
        const parts = line.split("|").map((s) => s?.trim() || "")
        const dia = parts[0] || ""
        const nombre = parts[1] || ""
        const horario = parts[2] || ""
        return `<div class="evento-item"><div class="evento-dia">${dia}</div><div class="evento-cuerpo"><div class="evento-nombre">${nombre}</div>${horario ? `<div class="evento-horario">${horario}</div>` : ""}</div></div>`
      })
      .join("\n")
  }

  // Fallback genérico para listas
  return lines
    .map((line) => {
      const parts = line.split("|").map((s) => s?.trim() || "")
      if (parts.length === 2) {
        return `<div class="item-fila" style="display:flex; justify-content:space-between; margin-bottom:12px;"><span style="font-weight:500;">${parts[0]}</span><span>${parts[1]}</span></div>`
      }
      return `<div class="item-fila" style="margin-bottom:10px;">${line}</div>`
    })
    .join("\n")
}

/**
 * Interpola un HTML template reemplazando {{key}} por los valores proporcionados.
 */
export function renderTemplate(
  htmlTemplate: string,
  values: Record<string, string>
): string {
  if (!htmlTemplate) return ""
  let rendered = htmlTemplate

  // Si existe una variable `lista`, formatearla primero
  if (values.lista !== undefined) {
    const formattedList = formatListToHtml(htmlTemplate, values.lista)
    rendered = rendered.replace(/\{\{lista\}\}/g, formattedList)
  }

  return rendered.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return values[key] ?? ""
  })
}

/**
 * Genera el documento HTML completo listo para renderizar en un iframe o exportar.
 */
export function buildFullHtmlDocument(
  htmlTemplate: string,
  values: Record<string, string>,
  width = 1080,
  height = 1350
): string {
  const bodyContent = renderTemplate(htmlTemplate, values)
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    width: ${width}px;
    height: ${height}px;
    overflow: hidden;
    background: transparent;
    font-family: 'Lora', Georgia, serif;
    -webkit-font-smoothing: antialiased;
  }
</style>
</head>
<body>${bodyContent}</body>
</html>`
}

/**
 * Genera los valores por defecto a partir de las variables de una plantilla.
 * Todos los textos y valores por defecto provienen 100% de la base de datos.
 */
export function getDefaultValues(
  variables: VariableDefinicion[]
): Record<string, string> {
  const values: Record<string, string> = {}
  if (!variables || !Array.isArray(variables)) return values
  for (const v of variables) {
    values[v.key] = v.default_val ?? ""
  }
  return values
}

/**
 * Renderiza un HTML template a un canvas y exporta como PNG Blob.
 * Usa un iframe oculto para aislar completamente el HTML y capturarlo en alta resolución.
 */
export async function renderToPng(
  htmlTemplate: string,
  values: Record<string, string>,
  width = 1080,
  height = 1350
): Promise<Blob> {
  const fullHtml = buildFullHtmlDocument(htmlTemplate, values, width, height)

  // Crear contenedor offscreen
  const container = document.createElement("div")
  container.style.position = "fixed"
  container.style.left = "-99999px"
  container.style.top = "-99999px"
  container.style.width = `${width}px`
  container.style.height = `${height}px`
  container.style.overflow = "hidden"
  document.body.appendChild(container)

  // Crear iframe
  const iframe = document.createElement("iframe")
  iframe.style.width = `${width}px`
  iframe.style.height = `${height}px`
  iframe.style.border = "none"
  iframe.style.overflow = "hidden"
  container.appendChild(iframe)

  await new Promise<void>((resolve) => {
    iframe.onload = () => resolve()
    iframe.srcdoc = fullHtml
  })

  // Esperar a que las fuentes carguen en el iframe
  try {
    if (iframe.contentDocument?.fonts?.ready) {
      await iframe.contentDocument.fonts.ready
    }
  } catch {
    await new Promise((r) => setTimeout(r, 400))
  }

  // Serializar el contenido del iframe a SVG foreignObject
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")!

  const docHtml = iframe.contentDocument?.documentElement?.outerHTML || fullHtml
  const svgData = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">
          ${docHtml}
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
    document.body.removeChild(container)
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error("No se pudo generar el PNG"))
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
