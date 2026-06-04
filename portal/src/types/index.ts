export interface PublicAnimal {
  id: number;
  nombre: string;
  especie: 'perro' | 'gato' | 'otro';
  raza?: string;
  sexo?: 'macho' | 'hembra';
  edad_años?: number;
  edad_meses?: number;
  peso_kg?: number;
  tamaño?: 'pequeño' | 'mediano' | 'grande';
  color?: string;
  descripcion?: string;
  hogar_ideal?: string;
  experiencia_previa?: string;
  nivel_actividad: number;
  soc_perros: number;
  soc_gatos: number;
  soc_niños: number;
  vacunado: boolean;
  esterilizado: boolean;
  microchip: boolean;
  desparasitado: boolean;
  ubicacion_texto?: string;
  fecha_entrada?: string;
  veces_visto: number;
  veces_compartido: number;
  foto_principal?: string;
  fotos_urls?: string[];
  fotos?: { id: number; url: string; es_principal: boolean }[];
  refugio_id: number;
  refugio_nombre: string;
  refugio_ciudad?: string;
  refugio_slug?: string;
  refugio_logo?: string;
  refugio_email?: string;
  refugio_telefono?: string;
  refugio_website?: string;
  refugio_instagram?: string;
  refugio_facebook?: string;
  refugio_animales_en_adopcion?: number;
  similar?: PublicAnimal[];
  created_at: string;
}

export interface PublicShelter {
  id: number;
  nombre: string;
  ciudad?: string;
  slug?: string;
  logo_url?: string;
  cover_url?: string;
  description_public?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  email?: string;
  telefono?: string;
  animales_en_adopcion: number;
  adopciones_completadas?: number;
  animales?: PublicAnimal[];
}

export interface PublicStats {
  animales_activos: number;
  adopciones_completadas: number;
  protectoras: number;
  sos_resueltos: number;
}

export interface PublicSosAlert {
  id: number;
  tipo: 'lost' | 'found';
  urgencia: 'high' | 'medium' | 'low';
  estado: 'active' | 'rescued' | 'resolved' | 'false_alarm';
  especie?: string;
  raza?: string;
  color?: string;
  tamaño?: string;
  nombre_animal?: string;
  descripcion?: string;
  fotos: string[];
  latitud?: number;
  longitud?: number;
  ubicacion_descripcion?: string;
  codigo_referencia?: string;
  created_at: string;
}

export interface AnimalsResponse {
  animals: PublicAnimal[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
