export type CategoriaHorario = 'misa' | 'confesion' | 'adoracion' | 'secretaria' | 'otro';
export type CategoriaGaleria = 'templo' | 'celebraciones' | 'comunidad';

export interface Horario {
  id: string;
  categoria: CategoriaHorario;
  dia_semana: number; // 0 = Domingo ... 6 = Sábado
  hora_inicio: string;
  hora_fin?: string | null;
  titulo: string;
  descripcion?: string | null;
  lugar: string;
  sacerdote_encargado?: string | null;
  es_destacado: boolean;
  activo: boolean;
  orden: number;
}

export interface Aviso {
  id: string;
  fecha: string;
  titulo: string;
  descripcion: string;
  activo: boolean;
  orden: number;
}

export interface FotoGaleria {
  id: string;
  titulo: string;
  descripcion?: string | null;
  categoria: CategoriaGaleria;
  imagen_url: string;
  es_destacado: boolean;
  activo: boolean;
  orden: number;
}

export interface MensajeContacto {
  id: string;
  nombre: string;
  correo: string;
  telefono?: string | null;
  motivo: string;
  mensaje: string;
  canal_preferido?: string;
  leido: boolean;
  respondido: boolean;
  created_at: string;
}
