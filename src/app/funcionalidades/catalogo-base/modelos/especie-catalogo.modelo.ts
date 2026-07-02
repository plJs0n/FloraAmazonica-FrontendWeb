export interface EspecieCatalogo {
  id: string;
  scientific_name: string;
  family: string;
  is_active: boolean;
  created_at: string;
}

export enum ModoImportacion {
  AGREGAR = 'agregar',
  REEMPLAZAR = 'reemplazar',
}

export type AccionFila = 'nuevo' | 'actualizado' | 'conservado' | 'desactivado';

export interface FilaPreview {
  scientific_name: string;
  family: string;
  action: AccionFila;
}

export interface ErrorFilaCsv {
  row: number;
  message: string;
}

export interface ResultadoImportacion {
  nuevos: number;
  actualizados: number;
  conservados: number;
  desactivados: number;
  errores: ErrorFilaCsv[];
  preview: FilaPreview[];
}

export interface ActualizarEspecieDto {
  scientific_name?: string;
  family?: string;
}