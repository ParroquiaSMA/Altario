-- ==============================================================================
-- BLOG / NOVEDADES DE LA PARROQUIA
-- ==============================================================================

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  slug text unique not null,
  titulo text not null,
  extracto text not null default '',
  contenido text not null default '',
  imagen_url text,
  autor text not null default 'Secretaría Parroquial',
  categoria text not null default 'general',
  publicado boolean not null default false,
  fecha_publicacion date,
  orden integer not null default 0
);

alter table public.blog_posts enable row level security;

create policy "Lectura pública de blog publicado"
  on public.blog_posts for select using (publicado = true);

create policy "Acceso total blog para CMS"
  on public.blog_posts for all using (true) with check (true);
