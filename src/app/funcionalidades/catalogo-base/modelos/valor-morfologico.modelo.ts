// funcionalidades/catalogo-base/modelos/valor-morfologico.modelo.ts

export type TipoSeleccion = 'single' | 'multiple';

export type Habito = 'árbol' | 'palmera' | 'arbusto' | 'liana' | 'hierba';

export const HABITOS: Habito[] = ['árbol', 'palmera', 'arbusto', 'liana', 'hierba'];

/**
 * Coincide 1:1 con la entidad MorphologicalValue del backend.
 * Cada fila = una opción (option_value) dentro de un campo (field_name),
 * de una sección (section), de un hábito (habit).
 */
export interface ValorMorfologico {
  id: string;
  habit: string;
  section: string;
  field_name: string;
  option_value: string;
  selection_type: TipoSeleccion;
  is_required: boolean;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

/** Payload para POST /morfologia */
export interface CrearValorMorfologico {
  habit: string;
  section: string;
  field_name: string;
  option_value: string;
  selection_type?: TipoSeleccion;
  is_required?: boolean;
  display_order?: number;
}

/** Payload para PATCH /morfologia/:id */
export interface ActualizarValorMorfologico {
  habit?: string;
  section?: string;
  field_name?: string;
  option_value?: string;
  selection_type?: TipoSeleccion;
  is_required?: boolean;
  display_order?: number;
}

/**
 * Agrupación en memoria para la UI: la tabla es plana en el backend,
 * pero el administrador la manipula como "campos" (field_name) con
 * varias opciones (option_value) cada uno.
 */
export interface CampoMorfologico {
  clave: string;            // section + field_name normalizado, identifica el grupo
  section: string;
  field_name: string;
  selection_type: TipoSeleccion;
  is_required: boolean;
  display_order: number;    // menor display_order de sus opciones (orden del bloque)
  activo: boolean;          // true si al menos una opción está activa
  opciones: ValorMorfologico[];  // cada opción con su propio id
}