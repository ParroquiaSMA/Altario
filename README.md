# Altario ⛪

> Arquitectura web moderna, ultraligera y modular para comunidades parroquiales e iglesias. Impulsado por **Astro**, **Supabase (PostgreSQL)** y preparado para **Vercel**.

---

## 🌟 Características de la Feature Base (Módulo 1: Website & Horarios)

- ⚡ **Rendimiento Instantáneo**: Creado con **Astro**, sin sobrecarga innecesaria de JavaScript en el cliente.
- 🗄️ **Base de Datos PostgreSQL (Supabase)**: Tabla `horarios` con tipado estricto TypeScript y políticas de seguridad RLS.
- 🎛️ **Filtros Interactivos Reactivos**: Consulta de horarios por día de la semana y por categoría (Misas, Confesiones, Adoración, Secretaría).
- 🛡️ **Modo Resiliente / Local Fallback**: Si las claves de Supabase no están presentes en `.env`, el sitio funciona y se previsualiza inmediatamente con datos de muestra locales.
- 💎 **Diseño Premium**: Interfaz sobria, cálida y adaptable (responsive) con tipografía Google Fonts (*Playfair Display* & *Plus Jakarta Sans*) y sistema de diseño Vanilla CSS.

---

## 🚀 Inicio Rápido Local

### 1. Instalar dependencias
```bash
npm install
```

### 2. Iniciar el servidor de desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:4321`.

---

## 🔌 Conexión con Supabase

### Paso 1: Crear las tablas en Supabase
1. Ingresa a tu panel de control en [Supabase](https://supabase.com).
2. Ve a la sección **SQL Editor**.
3. Abre el archivo `supabase/schema.sql` de este proyecto, copia su contenido y presiona **Run**.

### Paso 2: Configurar variables de entorno
1. Crea un archivo `.env` en la raíz copiando el archivo de ejemplo:
   ```bash
   cp .env.example .env
   ```
2. En Supabase ve a **Project Settings -> API** y copia las claves:
   ```env
   PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=tu-anon-public-key-aqui
   ```
3. Reinicia tu servidor `npm run dev`. ¡Listo! Ahora los datos se leen directamente de tu base de datos en Supabase.

---

## 📂 Estructura del Proyecto

```text
altario/
├── supabase/
│   └── schema.sql         # Script SQL con tablas, RLS e índices
├── src/
│   ├── components/
│   │   ├── Header.astro       # Barra de navegación e identidad
│   │   ├── Hero.astro         # Bienvenida y acceso rápido
│   │   ├── HorariosList.astro # Feature central de horarios con filtros
│   │   └── Footer.astro       # Ubicación, secretaría y contacto
│   ├── layouts/
│   │   └── Layout.astro       # Layout HTML con SEO y metadatos
│   ├── lib/
│   │   └── supabase.ts        # Cliente Supabase, helpers y mock fallback
│   ├── styles/
│   │   └── global.css         # Sistema de diseño y tokens CSS
│   ├── types/
│   │   └── database.ts        # Tipos TypeScript de Supabase y Horarios
│   └── pages/
│       └── index.astro        # Landing page del módulo Website
├── .env.example
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

---

## 🗺️ Roadmap de Próximos Módulos
- [ ] **Módulo 2**: Próximos Eventos y Fiestas Patronales con calendario.
- [ ] **Módulo 3**: Intenciones de Misa y Peticiones de Oración comunitarias.
- [ ] **Módulo 4**: Portal de Grupos y Ministerios Parroquiales.
- [ ] **Módulo 5**: Donaciones y sostenimiento parroquial.

---

## 🚀 Despliegue en Vercel

1. Sube este repositorio a GitHub / GitLab.
2. Inicia sesión en [Vercel](https://vercel.com) e importa el proyecto.
3. En la configuración del proyecto en Vercel, agrega las dos Variables de Entorno:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
4. Presiona **Deploy**. Vercel compilará el sitio y te entregará una URL con certificado SSL gratuito.
