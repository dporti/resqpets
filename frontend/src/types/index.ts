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

export type AdoptionEstado = 'pendiente' | 'en_evaluacion' | 'entrevista_programada' | 'aprobada' | 'rechazada' | 'desistida';

export interface AdoptionRequest {
  id: number;
  refugio_id: number;
  animal_id?: number;
  nombre: string;
  email?: string;
  telefono?: string;
  tipo_vivienda?: string;
  tiene_terraza?: boolean;
  horas_solo?: number;
  experiencia_previa?: string;
  otros_animales?: string;
  ninos?: boolean;
  edades_ninos?: string;
  motivacion?: string;
  estado: AdoptionEstado;
  canal?: string;
  puntuacion?: number;
  notas_internas?: string;
  motivo_rechazo?: string;
  animal_nombre?: string;
  animal_especie?: string;
  animal_foto?: string;
  animal_nivel_actividad?: number;
  animal_soc_perros?: number;
  animal_soc_gatos?: number;
  animal_soc_niños?: number;
  animal_hogar_ideal?: string;
  nivel_actividad?: number;
  soc_perros?: number;
  soc_gatos?: number;
  soc_niños?: number;
  hogar_ideal?: string;
  timeline?: AdoptionTimeline[];
  entrevistas?: AdoptionInterview[];
  created_at: string;
  updated_at?: string;
}

export interface AdoptionInterview {
  id: number;
  request_id: number;
  fecha: string;
  tipo: string;
  notas?: string;
  created_at: string;
}

export interface AdoptionTimeline {
  id: number;
  tipo: string;
  descripcion?: string;
  usuario_nombre?: string;
  created_at: string;
}

export interface ChecklistItem {
  id: number;
  expedient_id: number;
  fase: number;
  item_key: string;
  completado: boolean;
  completado_por?: number;
  completado_por_nombre?: string;
  completado_at?: string;
  notas?: string;
  file_url?: string;
}

export interface AdoptionExpedient {
  id: number;
  refugio_id: number;
  request_id?: number;
  animal_id?: number;
  adoptante_nombre?: string;
  adoptante_email?: string;
  adoptante_telefono?: string;
  fase_actual: number;
  animal_nombre?: string;
  animal_especie?: string;
  animal_raza?: string;
  animal_foto?: string;
  items_completados?: number;
  items_total?: number;
  checklist?: ChecklistItem[];
  timeline?: AdoptionTimeline[];
  created_at: string;
  updated_at?: string;
  completed_at?: string;
}

export type FamilyStatus = 'available' | 'full' | 'paused' | 'inactive';

export interface FosterFamily {
  id: number;
  refugio_id: number;
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  zona?: string;
  max_animales: number;
  animales_actuales: number;
  acepta_perros: boolean;
  acepta_gatos: boolean;
  acepta_otros: boolean;
  acepta_pequeño: boolean;
  acepta_mediano: boolean;
  acepta_grande: boolean;
  acepta_necesidades_especiales: boolean;
  acepta_cachorros: boolean;
  acepta_seniors: boolean;
  tiene_jardin: boolean;
  otros_animales_casa?: string;
  ninos_casa: boolean;
  edades_ninos?: string;
  notas?: string;
  estado: FamilyStatus;
  karma_puntos: number;
  avatar_url?: string;
  fecha_alta?: string;
  acogidas_activas_count?: number;
  acogidas_total?: number;
  acogidas_activas?: FosterAssignment[];
  historial?: FosterAssignment[];
  karma_historial?: KarmaEvent[];
  created_at: string;
  updated_at?: string;
}

export interface FosterAssignment {
  id: number;
  refugio_id: number;
  animal_id?: number;
  familia_id?: number;
  iniciada_at: string;
  fin_estimado_at?: string;
  finalizada_at?: string;
  estado: 'active' | 'completed' | 'cancelled';
  motivo_fin?: string;
  valoracion?: number;
  notas_valoracion?: string;
  notas_coordinador?: string;
  animal_nombre?: string;
  animal_especie?: string;
  animal_raza?: string;
  animal_foto?: string;
  familia_nombre?: string;
  familia_zona?: string;
  familia_telefono?: string;
  dias_acogida?: number;
  dias_totales?: number;
  ultimo_contacto?: string;
  created_at: string;
}

export interface FosterContact {
  id: number;
  assignment_id: number;
  tipo: string;
  contactado_at: string;
  estado_animal: string;
  notas?: string;
  requiere_accion: boolean;
  descripcion_accion?: string;
  usuario_nombre?: string;
  created_at: string;
}

export interface KarmaEvent {
  id: number;
  entity_type: string;
  entity_id: number;
  puntos: number;
  razon?: string;
  created_at: string;
}

export interface HealthEvent {
  id: number;
  animal_id: number;
  tipo: string;
  fecha: string;
  titulo: string;
  descripcion?: string;
  created_by?: number;
  created_at: string;
  usuario_nombre?: string;
}

export interface BehaviorEvaluation {
  id: number;
  animal_id: number;
  fecha: string;
  evaluador?: string;
  nivel_actividad: number;
  soc_perros: number;
  soc_gatos: number;
  soc_niños: number;
  hogar_ideal?: string;
  experiencia_previa?: string;
  notas?: string;
  created_by?: number;
  created_at: string;
  usuario_nombre?: string;
}

export interface AnimalDocument {
  id: number;
  animal_id: number;
  tipo: string;
  nombre: string;
  file_url: string;
  subido_por?: number;
  created_at: string;
  usuario_nombre?: string;
}

export interface AnimalFotoFull {
  id: number;
  animal_id: number;
  url: string;
  es_principal: boolean;
  created_at?: string;
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
