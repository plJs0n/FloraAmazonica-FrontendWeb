export interface Registrador {
  id: string;
  first_name: string;
  paternal_last_name: string;
  maternal_last_name: string;
  email: string;
}

export interface Validador {
  id: string;
  first_name: string;
  paternal_last_name: string;
  email: string;
}

export interface Foto {
  id: string;
  photo_type: string;
  cloudinary_url: string;
  author_id: string;
}

export interface RegistroPendiente {
  id: string;
  tracking_code: string;
  scientific_name: string;
  family: string;
  habit: string;
  status: EstadoRegistro;
  submitted_at: string;
  registrar: Registrador;
  photos: Foto[];
}

export interface FichaRegistro extends RegistroPendiente {
  country_distribution: string[];
  height: number | null;
  crown_diameter_parallel: number | null;       // antes: crown_diameter
  crown_diameter_perpendicular: number | null;  // nuevo
  crown_base_height: number | null;             // nuevo
  cap: number | null;
  dap: number | null;
  bark_texture: string | null;                  // antes: tallocorteza (o como se llamaba)
  latitude: number | null;
  longitude: number | null;
  morphological_data: Record<string, any>;
  observation_notes: string | null;
  validated_at: string | null;
  validator: Validador | null;
}

export type EstadoRegistro = 'en_revision' | 'observado' | 'validado' | 'rechazado';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ChangeStatusPayload {
  status: EstadoRegistro;
  observation_notes?: string;
}

/**
 * Fila del catálogo morfológico (GET /morfologia?habit=X).
 * Define, para un hábito, qué field_name pertenece a qué sección
 * y en qué orden. Se usa para agrupar el morphological_data plano
 * del registro por sección en el detalle de validación.
 */
export interface ValorMorfologico {
  id: string;
  habit: string;
  section: string;
  field_name: string;
  option_value: string;
  selection_type: 'single' | 'multiple';
  field_type: 'option' | 'number';
  is_required: boolean;
  display_order: number;
  is_active: boolean;
  use_in_search: boolean;
  created_at: string;
}