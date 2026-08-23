import { createClient } from '@supabase/supabase-js';
import type { Horario, Aviso, FotoGaleria, Sacramento, Grupo, MensajeContacto } from '../types/database';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('tu-proyecto') &&
    !supabaseAnonKey.includes('tu-anon')
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==========================================
// SEEDS LOCALES (FALLBACK RESILIENTE)
// ==========================================

export const HORARIOS_SEED: Horario[] = [
  { id: '1', dia_semana: 1, categoria: 'misa', hora_inicio: '08:00', hora_fin: '08:45', titulo: 'Misa Matutina', descripcion: 'Lunes a viernes', lugar: 'Iglesia Principal', es_destacado: false, activo: true, orden: 1 },
  { id: '2', dia_semana: 1, categoria: 'misa', hora_inicio: '19:00', hora_fin: '19:45', titulo: 'Misa Vespertina', descripcion: 'Lunes a viernes', lugar: 'Iglesia Principal', es_destacado: false, activo: true, orden: 2 },
  { id: '3', dia_semana: 6, categoria: 'confesion', hora_inicio: '17:00', hora_fin: '18:30', titulo: 'Confesiones', descripcion: 'Sin pedir hora', lugar: 'Confesionarios', es_destacado: true, activo: true, orden: 1 },
  { id: '4', dia_semana: 6, categoria: 'misa', hora_inicio: '19:00', hora_fin: '20:00', titulo: 'Misa de Vigilia', descripcion: 'Misa de vigilia del domingo', lugar: 'Iglesia Principal', es_destacado: true, activo: true, orden: 2 },
  { id: '5', dia_semana: 0, categoria: 'misa', hora_inicio: '09:00', hora_fin: '10:00', titulo: 'Misa de la Mañana', descripcion: 'Eucaristía dominical', lugar: 'Iglesia Principal', es_destacado: false, activo: true, orden: 1 },
  { id: '6', dia_semana: 0, categoria: 'misa', hora_inicio: '11:00', hora_fin: '12:00', titulo: 'Misa con Familias y Coro', descripcion: 'Misa con las familias y el coro parroquial', lugar: 'Iglesia Principal', es_destacado: true, activo: true, orden: 2 },
  { id: '7', dia_semana: 0, categoria: 'misa', hora_inicio: '19:30', hora_fin: '20:30', titulo: 'Misa de la Tarde', descripcion: 'Eucaristía dominical vespertina', lugar: 'Iglesia Principal', es_destacado: false, activo: true, orden: 3 },
  { id: '8', dia_semana: 4, categoria: 'adoracion', hora_inicio: '18:00', hora_fin: '19:00', titulo: 'Adoración Eucarística', descripcion: 'En la capilla del Santísimo', lugar: 'Capilla del Santísimo', es_destacado: true, activo: true, orden: 1 }
];

export const AVISOS_SEED: Aviso[] = [
  {
    id: 'aviso-1',
    fecha: '2026-09-08',
    titulo: 'Fiesta patronal',
    descripcion: 'Misa solemne a las 19:00 y procesión con la imagen de Santa María de la Ayuda. Después, chocolatada en el salón.',
    activo: true,
    orden: 1
  },
  {
    id: 'aviso-2',
    fecha: '2026-09-20',
    titulo: 'Retiro para adultos',
    descripcion: 'De 9:00 a 16:00 en la casa de retiros. Inscripción en secretaría hasta el día 15.',
    activo: true,
    orden: 2
  },
  {
    id: 'aviso-3',
    fecha: '2026-10-04',
    titulo: 'Bendición de animales',
    descripcion: 'En el atrio, a las 11:00, en la memoria de san Francisco de Asís. Traelos con correa o transportadora.',
    activo: true,
    orden: 3
  }
];

export const GALERIA_SEED: FotoGaleria[] = [
  { id: 'f1', titulo: 'Campanario', descripcion: 'El campanario visto desde la vereda de enfrente, a media tarde.', categoria: 'templo', imagen_url: '/assets/img/fachada.jpg', es_destacado: true, activo: true, orden: 1 },
  { id: 'f2', titulo: 'Nave central', descripcion: 'La nave central con los bancos alineados hacia el altar.', categoria: 'templo', imagen_url: '/assets/img/nave.jpg', es_destacado: false, activo: true, orden: 2 },
  { id: 'f3', titulo: 'Rosetón, 1998', descripcion: 'El rosetón sobre la puerta principal, visto desde adentro.', categoria: 'templo', imagen_url: '/assets/img/roseton.jpg', es_destacado: true, activo: true, orden: 3 },
  { id: 'f4', titulo: 'Vitrales del ábside, 1974', descripcion: 'Detalle de uno de los cinco paños de vitral del ábside.', categoria: 'templo', imagen_url: '/assets/img/vitral.jpg', es_destacado: false, activo: true, orden: 4 },
  { id: 'f5', titulo: 'Portal de acceso', descripcion: 'El portal de acceso con sus tres arcos concéntricos.', categoria: 'templo', imagen_url: '/assets/img/portal.jpg', es_destacado: false, activo: true, orden: 5 },
  { id: 'f6', titulo: 'La patrona', descripcion: 'La imagen de Santa María de la Ayuda en su altar lateral, con velas encendidas.', categoria: 'celebraciones', imagen_url: '/assets/img/patrona.jpg', es_destacado: false, activo: true, orden: 6 },
  { id: 'f7', titulo: 'Velas del altar lateral', descripcion: 'Velas encendidas por los fieles en el altar lateral.', categoria: 'celebraciones', imagen_url: '/assets/img/velas.jpg', es_destacado: true, activo: true, orden: 7 },
  { id: 'f8', titulo: 'Café después de misa', descripcion: 'Encuentro en el salón parroquial después de la misa del domingo.', categoria: 'comunidad', imagen_url: '/assets/img/comunidad.jpg', es_destacado: false, activo: true, orden: 8 },
  { id: 'f9', titulo: 'Leccionario y candelabros', descripcion: 'El leccionario abierto sobre el ambón, entre dos candelabros de bronce.', categoria: 'celebraciones', imagen_url: '/assets/img/detalle.jpg', es_destacado: false, activo: true, orden: 9 }
];

export const SACRAMENTOS_SEED: Sacramento[] = [
  { id: 's1', slug: 'bautismo', titulo: 'Bautismo', descripcion: 'Se celebra el segundo y el cuarto sábado de cada mes, a las 16:00, en misa comunitaria. Los padres y padrinos participan antes de dos encuentros de preparación, un martes de por medio a las 20:00.', requisitos: 'Partida de nacimiento del niño y documento de padres y padrinos. Los padrinos tienen que estar confirmados.', categoria: 'sacramento', orden: 1 },
  { id: 's2', slug: 'primera-comunion', titulo: 'Primera Comunión', descripcion: 'La catequesis empieza en marzo y dura dos años. Los encuentros son los sábados de 10:00 a 11:30 y se pide que la familia participe de la misa dominical.', requisitos: 'Todo febrero en secretaría, para chicos desde 8 años. Se pide fe de bautismo.', categoria: 'sacramento', orden: 2 },
  { id: 's3', slug: 'confirmacion', titulo: 'Confirmación', descripcion: 'Para adolescentes desde los 14 años y para adultos que quieran completar su iniciación cristiana. Son dos años de preparación con encuentros semanales y un retiro.', requisitos: 'Marzo para adolescentes, agosto para adultos.', categoria: 'sacramento', orden: 3 },
  { id: 's4', slug: 'matrimonio', titulo: 'Matrimonio', descripcion: 'Reservá la fecha con seis meses de anticipación: los sábados de primavera se llenan temprano. El curso prematrimonial son cuatro encuentros y se dicta tres veces al año.', requisitos: 'Fe de bautismo actualizada de ambos (con menos de seis meses), documentos y dos testigos.', categoria: 'sacramento', orden: 4 },
  { id: 's5', slug: 'uncion-de-enfermos', titulo: 'Unción de enfermos', descripcion: 'Si alguien de la familia está internado, operándose o no puede salir de su casa, avisanos y el sacerdote lo visita. No hace falta esperar a que sea grave.', requisitos: 'Llamá a cualquier hora al teléfono de la parroquia. Si no atiende, dejá mensaje de voz.', categoria: 'acompanamiento', orden: 5 },
  { id: 's6', slug: 'exequias', titulo: 'Exequias', descripcion: 'Acompañamos a la familia en el velatorio, en la misa de despedida y en la misa de los treinta días. También hay un grupo de duelo que se reúne una vez al mes.', requisitos: 'Directa con la secretaría o a través de la empresa fúnebre.', categoria: 'acompanamiento', orden: 6 },
  { id: 's7', slug: 'orden-sagrado', titulo: 'Orden sagrado', descripcion: 'Si estás pensando en el sacerdocio o en la vida consagrada, podés hablar con el párroco sin compromiso. También hay encuentros vocacionales en la diócesis.', requisitos: 'Pedí una entrevista en secretaría. Queda entre vos y el sacerdote.', categoria: 'vocacion', orden: 7 },
  { id: 's8', slug: 'reconciliacion', titulo: 'Reconciliación', descripcion: 'Confesiones media hora antes de cada misa y los sábados de 17:00 a 18:30, sin pedir hora. Si preferís hablar con calma, se puede coordinar un encuentro aparte.', requisitos: 'En el confesionario de la nave lateral, o en la sacristía si necesitás acceso sin escalones.', categoria: 'sacramento', orden: 8 }
];

export const GRUPOS_SEED: Grupo[] = [
  { id: 'g1', nombre: 'Cáritas parroquial', descripcion: 'Ropero, entrega de alimentos y acompañamiento a familias del barrio. Recibimos donaciones de ropa en buen estado y alimentos no perecederos en la secretaría.', horario_encuentro: 'Martes y jueves, 15:00 – 18:00', orden: 1 },
  { id: 'g2', nombre: 'Catequesis de niños', descripcion: 'Dos años de preparación para la primera comunión, con un equipo de catequistas que se forma durante todo el año.', horario_encuentro: 'Sábados, 10:00 – 11:30', orden: 2 },
  { id: 'g3', nombre: 'Catequesis de adultos', descripcion: 'Para quienes no fueron bautizados, no hicieron la comunión o quieren confirmarse de grandes. Grupo chico y sin apuro.', horario_encuentro: 'Miércoles, 20:00', orden: 3 },
  { id: 'g4', nombre: 'Coro parroquial', descripcion: 'Anima la misa de las 11:00 del domingo y las celebraciones grandes. No hace falta saber leer música: hace falta venir a ensayar.', horario_encuentro: 'Ensayo: viernes, 20:00', orden: 4 },
  { id: 'g5', nombre: 'Grupo de jóvenes', descripcion: 'Encuentro semanal, salidas, campamentos y servicio en el barrio. Desde los 15 años.', horario_encuentro: 'Sábados, 19:45, después de misa', orden: 5 },
  { id: 'g6', nombre: 'Encuentro de adultos mayores', descripcion: 'Café, juegos de mesa, charlas y una salida por mes. Si te cuesta llegar, coordinamos que alguien te pase a buscar.', horario_encuentro: 'Miércoles, 15:00 – 17:30', orden: 6 },
  { id: 'g7', nombre: 'Ministros de la comunión', descripcion: 'Llevan la comunión a personas enfermas o que no pueden salir de su casa. Se forman una vez al año.', horario_encuentro: 'Domingos, después de la misa de 9:00', orden: 7 },
  { id: 'g8', nombre: 'Grupo de liturgia', descripcion: 'Prepara las celebraciones, los cantos y el adorno del templo según el tiempo litúrgico.', horario_encuentro: 'Primer lunes de cada mes, 19:45', orden: 8 }
];

// ==========================================
// HELPERS DE LECTURA ASINCRÓNICA
// ==========================================

export async function getHorarios(): Promise<Horario[]> {
  if (!supabase) return HORARIOS_SEED;
  try {
    const { data, error } = await supabase.from('horarios').select('*').eq('activo', true).order('orden');
    if (error || !data || data.length === 0) return HORARIOS_SEED;
    return data as Horario[];
  } catch {
    return HORARIOS_SEED;
  }
}

export async function getAvisos(): Promise<Aviso[]> {
  if (!supabase) return AVISOS_SEED;
  try {
    const { data, error } = await supabase.from('avisos').select('*').eq('activo', true).order('fecha', { ascending: true });
    if (error || !data || data.length === 0) return AVISOS_SEED;
    return data as Aviso[];
  } catch {
    return AVISOS_SEED;
  }
}

export async function getGaleria(): Promise<FotoGaleria[]> {
  if (!supabase) return GALERIA_SEED;
  try {
    const { data, error } = await supabase.from('galeria').select('*').eq('activo', true).order('orden');
    if (error || !data || data.length === 0) return GALERIA_SEED;
    return data as FotoGaleria[];
  } catch {
    return GALERIA_SEED;
  }
}

export async function getSacramentos(): Promise<Sacramento[]> {
  if (!supabase) return SACRAMENTOS_SEED;
  try {
    const { data, error } = await supabase.from('sacramentos').select('*').order('orden');
    if (error || !data || data.length === 0) return SACRAMENTOS_SEED;
    return data as Sacramento[];
  } catch {
    return SACRAMENTOS_SEED;
  }
}

export async function getGrupos(): Promise<Grupo[]> {
  if (!supabase) return GRUPOS_SEED;
  try {
    const { data, error } = await supabase.from('grupos').select('*').order('orden');
    if (error || !data || data.length === 0) return GRUPOS_SEED;
    return data as Grupo[];
  } catch {
    return GRUPOS_SEED;
  }
}

export async function enviarMensaje(mensaje: MensajeContacto): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    console.log('Mensaje de contacto simulado (sin Supabase):', mensaje);
    return { success: true };
  }
  try {
    const { error } = await supabase.from('mensajes_contacto').insert([mensaje]);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error al enviar mensaje' };
  }
}
