export type UserRole = 'admin' | 'coordinador' | 'voluntario';

export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: UserRole;
  refugioId: number;
  refugioNombre?: string;
  avatarUrl?: string;
  ultimoAcceso?: string;
  activo?: boolean;
  createdAt?: string;
}

export interface Animal {
  id: number;
  refugioId: number;
  idInterno?: string;
  id_interno?: string;
  nombre: string;
  especie: 'perro' | 'gato' | 'otro';
  raza?: string;
  sexo?: 'macho' | 'hembra';
  fechaNacimiento?: string;
  fecha_nacimiento?: string;
  pesoKg?: number;
  peso_kg?: number;
  estado: 'en_acogida' | 'en_residencia' | 'en_adopcion' | 'en_proceso' | 'en_evaluacion' | 'fallecido';
  ubicacionTexto?: string;
  ubicacion_texto?: string;
  estadoSalud?: string;
  estado_salud?: string;
  esterilizado?: boolean;
  vacunado?: boolean;
  desparasitado?: boolean;
  microchip?: boolean;
  numMicrochip?: string;
  num_microchip?: string;
  pasaporte?: boolean;
  procedencia?: string;
  fechaEntrada?: string;
  fecha_entrada?: string;
  color?: string;
  tipoPelo?: string;
  tipo_pelo?: string;
  ojos?: string;
  tamaño?: 'pequeño' | 'mediano' | 'grande';
  señasParticulares?: string;
  señas_particulares?: string;
  nivelActividad?: number;
  nivel_actividad: number;
  socPerros?: number;
  soc_perros: number;
  socGatos?: number;
  soc_gatos: number;
  socNiños?: number;
  soc_niños: number;
  hogarIdeal?: string;
  hogar_ideal?: string;
  experienciaPrevia?: string;
  experiencia_previa?: string;
  descripcion?: string;
  webPublicado?: boolean;
  web_publicado?: boolean;
  vecesCompartido?: number;
  veces_compartido?: number;
  vecesVisto?: number;
  veces_visto: number;
  contactosRecibidos?: number;
  contactos_recibidos?: number;
  fotoPrincipal?: string;
  foto_principal?: string;
  edadAños?: number;
  edad_años?: number;
  edadMeses?: number;
  edad_meses?: number;
  fotos?: AnimalFoto[];
  notas?: AnimalNota[];
  actividad?: Actividad[];
  updatedAt?: string;
  updated_at?: string;
  createdAt?: string;
  created_at?: string;
}

export interface AnimalFoto {
  id: number;
  animalId: number;
  url: string;
  esPrincipal: boolean;
}

export interface AnimalNota {
  id: number;
  animalId?: number;
  animal_id?: number;
  autorId?: number;
  autor_id?: number;
  autorNombre?: string;
  autor_nombre?: string;
  autorAvatar?: string;
  autor_avatar?: string;
  texto: string;
  pinned: boolean;
  createdAt?: string;
  created_at?: string;
}

export interface Aviso {
  id: number;
  refugioId: number;
  titulo: string;
  descripcion?: string;
  tipo: 'perdido' | 'encontrado' | 'urgente';
  estado: 'activo' | 'resuelto' | 'archivado';
  ubicacion?: string;
  lat?: number;
  lng?: number;
  fotoUrl?: string;
  foto_url?: string;
  creadoPor?: number;
  createdAt: string;
  created_at?: string;
}

export interface Evento {
  id: number;
  refugioId: number;
  titulo: string;
  descripcion?: string;
  fechaInicio?: string;
  fecha_inicio: string;
  fechaFin?: string;
  fecha_fin?: string;
  lugar?: string;
  creadoPor?: number;
  createdAt: string;
}

export interface Actividad {
  id: number;
  refugioId: number;
  animalId?: number;
  usuarioId?: number;
  tipo: string;
  titulo: string;
  descripcion?: string;
  usuarioNombre?: string;
  usuario_nombre?: string;
  avatarUrl?: string;
  avatar_url?: string;
  animalNombre?: string;
  animal_nombre?: string;
  createdAt: string;
  created_at?: string;
}

export interface DashboardData {
  stats: {
    totalAnimales: number;
    enAcogida: number;
    enResidencia: number;
    enAdopcion: number;
    enProceso: number;
    enEvaluacion: number;
    nuevosHoy: number;
    nuevosAyer: number;
    avisosActivos: number;
  };
  animalesRecientes: Animal[];
  avisos: Aviso[];
  actividad: Actividad[];
  adopciones: {
    esteMes: number;
    esteAño: number;
    mesAnterior: number;
  };
  eventos: Evento[];
  donaciones: {
    esteMes: number;
    mesAnterior: number;
    esteAño: number;
    objetivo: number;
  };
}
