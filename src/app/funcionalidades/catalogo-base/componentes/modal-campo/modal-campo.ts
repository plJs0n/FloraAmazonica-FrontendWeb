// funcionalidades/catalogo-base/componentes/modal-campo/modal-campo.ts

import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CampoMorfologico,
  Habito,
  HABITOS,
  TipoSeleccion,
} from '../../modelos/valor-morfologico.modelo';

/** Datos que el modal devuelve al confirmar. La página decide qué peticiones lanzar. */
export interface ResultadoModalCampo {
  section: string;
  field_name: string;
  selection_type: TipoSeleccion;
  is_required: boolean;
  opciones: string[];       // solo en modo crear
  habitos: string[];        // hábitos destino (crear) o a sincronizar (editar)
  aplicarEnOtros: boolean;  // en edición: aplicar metadatos también a hábitos gemelos
}

@Component({
  selector: 'app-modal-campo',
  imports: [FormsModule],
  templateUrl: './modal-campo.html',
  styleUrl: './modal-campo.css',
})
export class ModalCampo implements OnInit {
  /** Si viene un campo, es edición; si no, es creación */
  @Input() campo: CampoMorfologico | null = null;
  /** Hábito desde el que se abrió el modal */
  @Input() habitoActual!: Habito;
  /** Otros hábitos donde ya existe este mismo campo (solo relevante en edición) */
  @Input() habitosGemelos: string[] = [];

  @Output() confirmar = new EventEmitter<ResultadoModalCampo>();
  @Output() cerrar = new EventEmitter<void>();

  readonly habitos = HABITOS;

  section = '';
  field_name = '';
  selection_type: TipoSeleccion = 'single';
  is_required = true;

  // Solo en creación
  opciones: string[] = [];
  nuevaOpcion = '';
  habitosSeleccionados: Record<string, boolean> = {};

  // Solo en edición
  aplicarEnOtros = false;

  ngOnInit(): void {
    if (this.campo) {
      // Modo edición: precargar metadatos. Las opciones no se editan aquí.
      this.section = this.campo.section;
      this.field_name = this.campo.field_name;
      this.selection_type = this.campo.selection_type;
      this.is_required = this.campo.is_required;
    } else {
      // Modo creación: el hábito actual viene marcado por defecto.
      for (const h of this.habitos) {
        this.habitosSeleccionados[h] = h === this.habitoActual;
      }
    }
  }

  get esEdicion(): boolean {
    return this.campo !== null;
  }

  get tieneGemelos(): boolean {
    return this.habitosGemelos.length > 0;
  }

  agregarOpcion(): void {
    const valor = this.nuevaOpcion.trim();
    if (!valor) return;
    const existe = this.opciones.some(
      (o) => o.trim().toLowerCase() === valor.toLowerCase(),
    );
    if (existe) return;
    this.opciones.push(valor);
    this.nuevaOpcion = '';
  }

  quitarOpcion(indice: number): void {
    this.opciones.splice(indice, 1);
  }

  private habitosMarcados(): string[] {
    return this.habitos.filter((h) => this.habitosSeleccionados[h]);
  }

  puedeConfirmar(): boolean {
    if (!this.section.trim() || !this.field_name.trim()) return false;
    if (this.esEdicion) return true;
    return this.opciones.length > 0 && this.habitosMarcados().length > 0;
  }

  onConfirmar(): void {
    if (!this.puedeConfirmar()) return;
    this.confirmar.emit({
      section: this.section.trim(),
      field_name: this.field_name.trim(),
      selection_type: this.selection_type,
      is_required: this.is_required,
      opciones: this.opciones,
      habitos: this.esEdicion ? this.habitosGemelos : this.habitosMarcados(),
      aplicarEnOtros: this.aplicarEnOtros,
    });
  }

  onCerrar(): void {
    this.cerrar.emit();
  }
}