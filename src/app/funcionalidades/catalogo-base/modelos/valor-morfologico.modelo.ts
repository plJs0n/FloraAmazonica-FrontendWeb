export type TipoSeleccion = 'single' | 'multiple';
export type TipoCampo = 'option' | 'number';

export type Habito = 'arbol' | 'palmera' | 'arbusto' | 'liana' | 'hierba';

export const HABITOS: Habito[] = ['arbol', 'palmera', 'arbusto', 'liana', 'hierba'];

export interface ValorMorfologico {
  id: string;
  habit: string;
  section: string;
  field_name: string;
  option_value: string;
  selection_type: TipoSeleccion;
  field_type: TipoCampo;
  is_required: boolean;
  display_order: number;
  is_active: boolean;
  use_in_search: boolean;
  created_at: string;
}

export interface CrearValorMorfologico {
  habit: string;
  section: string;
  field_name: string;
  option_value: string;
  selection_type?: TipoSeleccion;
  field_type?: TipoCampo;
  is_required?: boolean;
  display_order?: number;
}

export interface ActualizarValorMorfologico {
  habit?: string;
  section?: string;
  field_name?: string;
  option_value?: string;
  selection_type?: TipoSeleccion;
  field_type?: TipoCampo;
  is_required?: boolean;
  display_order?: number;
}

export interface CampoMorfologico {
  clave: string;
  section: string;
  field_name: string;
  selection_type: TipoSeleccion;
  field_type: TipoCampo;
  is_required: boolean;
  display_order: number;
  activo: boolean;
  use_in_search: boolean;
  opciones: ValorMorfologico[];
}