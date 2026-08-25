-- ==============================================================================
-- ALTARIO - SEEDS DE BASE DE DATOS POSTGRESQL (SUPABASE)
-- ==============================================================================

-- 1. TABLAS DE CATÁLOGO (Lookup / Diccionarios para Selects)
insert into public.catalogos (catalogo, nombre, codigo, descripcion, activo, orden)
values
  -- Tipos de Celebración
  ('tipos_horario', 'Misa', 'misa', 'Celebración eucarística', true, 1),
  ('tipos_horario', 'Confesión', 'confesion', 'Sacramento de la reconciliación', true, 2),
  ('tipos_horario', 'Adoración', 'adoracion', 'Adoración al Santísimo Sacramento', true, 3),
  ('tipos_horario', 'Secretaría', 'secretaria', 'Atención administrativa y trámites', true, 4),
  ('tipos_horario', 'Bautismos', 'bautismo', 'Celebración comunitaria de bautismo', true, 5),
  ('tipos_horario', 'Santo Rosario', 'rosario', 'Rezo del santo rosario', true, 6),

  -- Categorías de Galería
  ('categorias_galeria', 'El Templo', 'templo', 'Vistas del edificio, altar y campanario', true, 1),
  ('categorias_galeria', 'Celebraciones', 'celebraciones', 'Fiestas patronales, pascua y navidad', true, 2),
  ('categorias_galeria', 'Comunidad', 'comunidad', 'Grupos pastorales, coro y encuentros', true, 3),
  ('categorias_galeria', 'Historia', 'historia', 'Patrimonio histórico y archivos', true, 4),

  -- Lugares del Templo
  ('lugares', 'Iglesia Principal', 'principal', 'Nave central del templo', true, 1),
  ('lugares', 'Capilla del Santísimo', 'capilla', 'Capilla lateral para oración y adoración', true, 2),
  ('lugares', 'Confesionarios', 'confesionarios', 'Espacio de penitencia', true, 3),
  ('lugares', 'Atrio Parroquial', 'atrio', 'Explanada frontal del templo', true, 4),
  ('lugares', 'Salón Parroquial', 'salon', 'Salón de reuniones comunitarias', true, 5),

  -- Motivos de Contacto
  ('motivos_contacto', 'Bautismo', 'bautismo', 'Fechas y requisitos para bautismos', true, 1),
  ('motivos_contacto', 'Matrimonio', 'matrimonio', 'Expediente y reservas de casamientos', true, 2),
  ('motivos_contacto', 'Catequesis', 'catequesis', 'Comunión y confirmación de jóvenes/adultos', true, 3),
  ('motivos_contacto', 'Intenciones de Misa', 'intenciones', 'Misas de difuntos y acción de gracias', true, 4),
  ('motivos_contacto', 'Consulta General', 'general', 'Otras dudas e información', true, 5)
on conflict (catalogo, codigo) do nothing;

-- 2. HORARIOS
insert into public.horarios (dia_semana, categoria, hora_inicio, hora_fin, titulo, descripcion, lugar, es_destacado, orden)
values
  (0, 'misa', '09:00', '10:00', 'Misa de la Mañana', 'Eucaristía dominical comunitaria', 'Iglesia Principal', false, 1),
  (0, 'misa', '11:00', '12:00', 'Misa con las Familias', 'Misa comunitaria animada por el coro parroquial', 'Iglesia Principal', true, 2),
  (0, 'misa', '19:30', '20:30', 'Misa de la Tarde', 'Eucaristía vespertina del domingo', 'Iglesia Principal', false, 3),
  (1, 'misa', '08:00', '08:45', 'Misa Matutina', 'Eucaristía de primera hora', 'Iglesia Principal', false, 1),
  (1, 'misa', '19:00', '19:45', 'Misa Vespertina', 'Eucaristía diaria', 'Iglesia Principal', false, 2),
  (1, 'secretaria', '09:00', '12:00', 'Secretaría Parroquial (Mañana)', 'Atención de trámites y consultas', 'Salón Parroquial', false, 3),
  (1, 'secretaria', '16:00', '19:00', 'Secretaría Parroquial (Tarde)', 'Atención de trámites y consultas', 'Salón Parroquial', false, 4),
  (4, 'adoracion', '18:00', '19:00', 'Adoración Eucarística', 'Exposición del Santísimo Sacramento y oración silenciosa', 'Capilla del Santísimo', true, 2),
  (6, 'confesion', '17:00', '18:30', 'Confesiones', 'Atención sacerdotal sin necesidad de pedir hora', 'Confesionarios', true, 2),
  (6, 'misa', '19:00', '20:00', 'Misa de Vigilia', 'Misa de vigilia del domingo', 'Iglesia Principal', true, 3);

-- 3. AVISOS
insert into public.avisos (fecha, titulo, descripcion, orden)
values
  ('2026-09-08', 'Fiesta patronal', 'Misa solemne a las 19:00 y procesión con la imagen de Santa María de la Ayuda. Después, chocolatada en el salón.', 1),
  ('2026-09-20', 'Retiro para adultos', 'De 9:00 a 16:00 en la casa de retiros. Inscripción en secretaría hasta el día 15.', 2),
  ('2026-10-04', 'Bendición de animales', 'En el atrio, a las 11:00, en la memoria de san Francisco de Asís. Traelos con correa o transportadora.', 3);

-- 4. GALERÍA
insert into public.galeria (titulo, descripcion, categoria, imagen_url, orden)
values
  ('Campanario', 'El campanario visto desde la vereda de enfrente, a media tarde.', 'templo', '/assets/img/fachada.jpg', 1),
  ('Nave central', 'La nave central con los bancos alineados hacia el altar.', 'templo', '/assets/img/nave.jpg', 2),
  ('Rosetón, 1998', 'El rosetón sobre la puerta principal, visto desde adentro.', 'templo', '/assets/img/roseton.jpg', 3),
  ('Vitrales del ábside, 1974', 'Detalle de uno de los cinco paños de vitral del ábside.', 'templo', '/assets/img/vitral.jpg', 4),
  ('Portal de acceso', 'El portal de acceso con sus tres arcos concéntricos.', 'templo', '/assets/img/portal.jpg', 5),
  ('La patrona', 'La imagen de Santa María de la Ayuda en su altar lateral, con velas encendidas.', 'celebraciones', '/assets/img/patrona.jpg', 6),
  ('Velas del altar lateral', 'Velas encendidas por los fieles en el altar lateral.', 'celebraciones', '/assets/img/velas.jpg', 7),
  ('Café después de misa', 'Encuentro en el salón parroquial después de la misa del domingo.', 'comunidad', '/assets/img/comunidad.jpg', 8),
  ('Leccionario y candelabros', 'El leccionario abierto sobre el ambón, entre dos candelabros de bronce.', 'celebraciones', '/assets/img/detalle.jpg', 9);

-- 5. MENSAJES DE CONTACTO
insert into public.mensajes_contacto (nombre, correo, telefono, motivo, mensaje, leido, respondido)
values
  ('María González', 'maria@ejemplo.com', '099 111 222', 'Bautismo', 'Quisiera saber las fechas disponibles para bautizar a mi hijo en octubre.', false, false),
  ('Carlos Silva', 'carlos@ejemplo.com', '098 333 444', 'Consulta General', 'Me gustaría participar del coro parroquial o de Cáritas.', true, false),
  ('Lucía Fernández', 'lucia@ejemplo.com', '091 555 666', 'Catequesis', 'Necesito solicitar una partida de bautismo de 1995 para un casamiento.', true, true);

-- 6. CONFIGURACIÓN PARROQUIAL
insert into public.configuracion (clave, valor)
values
  ('parroquia', '{"nombre": "Santa María de la Ayuda", "diocesis": "Diócesis de Buenos Aires", "direccion": "Av. San Martín 1234, Buenos Aires", "telefono": "+54 11 4000-0000", "email": "contacto@santamariadelaayuda.org", "descripcion": "Parroquia Santa María de la Ayuda, al servicio de la comunidad desde 1892."}'::jsonb),
  ('redes', '{"facebook": "https://facebook.com/parroquiasantamaria", "instagram": "https://instagram.com/parroquiasantamaria", "youtube": "", "whatsapp": "+5491140000000"}'::jsonb)
on conflict (clave) do nothing;

-- 7. USUARIOS CMS
insert into public.usuarios_cms (nombre, email, rol, status, password_hash)
values
  ('Secretaría Parroquial', 'secretaria@santamariadelaayuda.org', 'admin', 'activo', 'hash:lbtveo:11'),
  ('Padre Martín', 'martin@santamariadelaayuda.org', 'editor', 'activo', 'hash:lbtveo:11')
on conflict (email) do nothing;

