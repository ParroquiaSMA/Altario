-- ==============================================================================
-- ALTARIO - ESQUEMA UNIFICADO DE BASE DE DATOS (POSTGRESQL / SUPABASE)
-- ==============================================================================

-- 1. EXTENSIONES
create extension if not exists "uuid-ossp";

-- ==============================================================================
-- 2. TABLAS DEL SISTEMA
-- ==============================================================================

-- TABLA: TABLAS DE CATÁLOGO (Lookup / Diccionarios para Selects)
create table if not exists public.catalogos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  catalogo text not null, -- 'tipos_horario', 'categorias_galeria', 'lugares', 'motivos_contacto'
  nombre text not null,
  codigo text not null,
  descripcion text,
  activo boolean not null default true,
  orden integer not null default 0,
  constraint catalogos_codigo_unique unique (catalogo, codigo)
);

-- TABLA: HORARIOS Y CELEBRACIONES
create table if not exists public.horarios (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  categoria text not null, -- Código del catálogo 'tipos_horario'
  dia_semana smallint not null check (dia_semana between 0 and 6), -- 0=Dom ... 6=Sab
  hora_inicio time not null,
  hora_fin time,
  titulo text not null,
  descripcion text,
  lugar text not null default 'Iglesia Principal',
  sacerdote_encargado text,
  es_destacado boolean not null default false,
  activo boolean not null default true,
  orden integer not null default 0
);

-- TABLA: AVISOS Y PRÓXIMAS FECHAS
create table if not exists public.avisos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fecha date not null,
  titulo text not null,
  descripcion text not null,
  activo boolean not null default true,
  orden integer not null default 0
);

-- TABLA: GALERÍA DE FOTOS
create table if not exists public.galeria (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  titulo text not null,
  descripcion text,
  categoria text not null, -- Código del catálogo 'categorias_galeria'
  imagen_url text not null,
  es_destacado boolean not null default false,
  activo boolean not null default true,
  orden integer not null default 0
);

-- TABLA: MENSAJES RECIBIDOS DEL FORMULARIO DE CONTACTO
create table if not exists public.mensajes_contacto (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre text not null,
  correo text not null,
  telefono text,
  motivo text not null, -- Código o nombre del catálogo 'motivos_contacto'
  mensaje text not null,
  canal_preferido text default 'correo',
  leido boolean not null default false,
  respondido boolean not null default false,
  notas_internas text
);

-- TABLA: CONFIGURACIÓN GENERAL DE LA PARROQUIA
create table if not exists public.configuracion (
  id uuid primary key default gen_random_uuid(),
  clave text unique not null,
  valor jsonb not null,
  updated_at timestamptz not null default now()
);

-- TABLA: USUARIOS ADMINISTRADORES DEL CMS
create table if not exists public.usuarios_cms (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre text not null,
  email text unique not null,
  rol text not null check (rol in ('admin', 'editor', 'viewer')),
  status text not null default 'activo' check (status in ('activo', 'inactivo')),
  password_hash text not null
);

-- TABLA: SACRAMENTOS Y TRÁMITES
create table if not exists public.sacramentos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  slug text unique not null,
  titulo text not null,
  descripcion text not null,
  requisitos text not null,
  categoria text not null,
  orden integer not null default 0
);

-- TABLA: GRUPOS Y VIDA PARROQUIAL
create table if not exists public.grupos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre text not null,
  descripcion text not null,
  horario_encuentro text not null,
  orden integer not null default 0
);

-- ==============================================================================
-- 3. SEGURIDAD POR FILA (RLS)
-- ==============================================================================

alter table public.catalogos enable row level security;
alter table public.horarios enable row level security;
alter table public.avisos enable row level security;
alter table public.galeria enable row level security;
alter table public.mensajes_contacto enable row level security;
alter table public.configuracion enable row level security;
alter table public.usuarios_cms enable row level security;
alter table public.sacramentos enable row level security;
alter table public.grupos enable row level security;

-- POLÍTICAS DE LECTURA PÚBLICA
create policy "Lectura pública de catálogos activos"
  on public.catalogos for select using (activo = true);

create policy "Lectura pública de horarios activos"
  on public.horarios for select using (activo = true);

create policy "Lectura pública de avisos activos"
  on public.avisos for select using (activo = true);

create policy "Lectura pública de galería activa"
  on public.galeria for select using (activo = true);

create policy "Lectura pública de configuración"
  on public.configuracion for select using (true);

create policy "Lectura pública de sacramentos"
  on public.sacramentos for select using (true);

create policy "Lectura pública de grupos"
  on public.grupos for select using (true);

create policy "Envío público de mensajes de contacto"
  on public.mensajes_contacto for insert with check (true);

-- POLÍTICAS DE GESTIÓN PARA EL CMS / USUARIOS AUTENTICADOS
create policy "Acceso total catalogos para CMS"
  on public.catalogos for all using (true) with check (true);

create policy "Acceso total horarios para CMS"
  on public.horarios for all using (true) with check (true);

create policy "Acceso total avisos para CMS"
  on public.avisos for all using (true) with check (true);

create policy "Acceso total galeria para CMS"
  on public.galeria for all using (true) with check (true);

create policy "Acceso total mensajes para CMS"
  on public.mensajes_contacto for all using (true) with check (true);

create policy "Acceso total configuracion para CMS"
  on public.configuracion for all using (true) with check (true);

create policy "Acceso total usuarios para CMS"
  on public.usuarios_cms for all using (true) with check (true);

create policy "Acceso total sacramentos para CMS"
  on public.sacramentos for all using (true) with check (true);

create policy "Acceso total grupos para CMS"
  on public.grupos for all using (true) with check (true);
