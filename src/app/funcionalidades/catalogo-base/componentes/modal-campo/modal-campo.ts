// funcionalidades/catalogo-base/componentes/modal-campo/modal-campo.ts

import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CampoMorfologico,
  Habito,
  HABITOS,
  TipoSeleccion,
  TipoCampo,
} from '../../modelos/valor-morfologico.modelo';
import { Seccion } from '../../modelos/seccion.modelo';

export interface ResultadoModalCampo {
  section: string;
  field_name: string;
  selection_type: TipoSeleccion;
  field_type: TipoCampo;
  is_required: boolean;
  opciones: string[];
  unidad: string;
  habitos: string[];
  aplicarEnOtros: boolean;
  crearSeccionEnHabitos: string[];
  agregarOtro: boolean;
}

@Component({
  selector: 'app-modal-campo',
  imports: [FormsModule],
  templateUrl: './modal-campo.html',
  styleUrl: './modal-campo.css',
})
export class ModalCampo implements OnInit {
  @Input() campo: CampoMorfologico | null = null;
  @Input() habitoActual!: Habito;
  @Input() habitosGemelos: string[] = [];
  @Input() seccionInicial: string = '';
  @Input() seccionesDisponibles: Seccion[] = [];
  @Input() seccionesPorHabito: Record<string, Seccion[]> = {};

  @Output() confirmar = new EventEmitter<ResultadoModalCampo>();
  @Output() cerrar = new EventEmitter<void>();

  readonly habitos = HABITOS;

  section = '';
  busquedaSeccion = '';
  dropdownVisible = false;

  field_name = '';
  selection_type: TipoSeleccion = 'single';
  field_type: TipoCampo = 'option';
  is_required = true;

  opciones: string[] = [];
  nuevaOpcion = '';
  permitirOtro = false;

  habitosSeleccionados: Record<string, boolean> = {};
  unidad = '';
  aplicarEnOtros = false;

  ngOnInit(): void {
    if (this.campo) {
      this.section = this.campo.section;
      this.busquedaSeccion = this.campo.section;
      this.field_name = this.campo.field_name;
      this.selection_type = this.campo.selection_type;
      this.field_type = this.campo.field_type;
      this.is_required = this.campo.is_required;
      if (this.campo.field_type === 'number' && this.campo.opciones.length > 0) {
        this.unidad = this.campo.opciones[0].option_value;
      }
    } else {
      for (const h of this.habitos) {
        this.habitosSeleccionados[h] = h === this.habitoActual;
      }
      if (this.seccionInicial) {
        this.section = this.seccionInicial;
        this.busquedaSeccion = this.seccionInicial;
      }
    }
  }

  get esEdicion(): boolean {
    return this.campo !== null;
  }

  get tieneGemelos(): boolean {
    return this.habitosGemelos.length > 0;
  }

  get esNumerico(): boolean {
    return this.field_type === 'number';
  }

  get tieneOtro(): boolean {
    if (!this.campo) return false;
    return this.campo.opciones.some(
      (o) => o.option_value.trim().toLowerCase() === 'otro',
    );
  }

  get habitosMarcadosList(): string[] {
    return this.habitos.filter((h) => this.habitosSeleccionados[h]);
  }

  get seccionesUnion(): Seccion[] {
    const habitos = this.esEdicion ? [this.habitoActual] : this.habitosMarcadosList;
    const nombres = new Map<string, Seccion>();
    for (const h of habitos) {
      for (const s of this.seccionesPorHabito[h] ?? []) {
        if (!nombres.has(s.name.toLowerCase())) {
          nombres.set(s.name.toLowerCase(), s);
        }
      }
    }
    return [...nombres.values()];
  }

  get seccionesFiltradas(): Seccion[] {
    const q = this.busquedaSeccion.trim().toLowerCase();
    if (!q) return this.seccionesUnion;
    return this.seccionesUnion.filter((s) => s.name.toLowerCase().includes(q));
  }

  get puedeCrearSeccion(): boolean {
    const q = this.busquedaSeccion.trim().toLowerCase();
    if (!q) return false;
    return !this.seccionesUnion.some((s) => s.name.toLowerCase() === q);
  }

  get seccionEsNueva(): boolean {
    if (!this.section) return false;
    return !this.seccionesUnion.some(
      (s) => s.name.toLowerCase() === this.section.toLowerCase(),
    );
  }

  onBuscarSeccion(): void {
    this.section = '';
    this.dropdownVisible = true;
  }

  seleccionarSeccion(seccion: Seccion): void {
    this.section = seccion.name;
    this.busquedaSeccion = seccion.name;
    this.dropdownVisible = false;
  }

  confirmarNuevaSeccion(): void {
    const nombre = this.busquedaSeccion.trim();
    if (!nombre) return;
    this.section = nombre;
    this.dropdownVisible = false;
  }

  limpiarSeccion(): void {
    this.section = '';
    this.busquedaSeccion = '';
    this.dropdownVisible = false;
  }

  onCerrarDropdown(): void {
    if (!this.section) {
      this.busquedaSeccion = '';
    }
    this.dropdownVisible = false;
  }

  onCambiarTipoCampo(tipo: TipoCampo): void {
    this.field_type = tipo;
    this.opciones = [];
    this.nuevaOpcion = '';
    this.unidad = '';
    this.permitirOtro = false;
  }

  agregarOpcion(): void {
    const valor = this.nuevaOpcion.trim();
    if (!valor) return;
    const existe = this.opciones.some(
      (o) => o.trim().toLowerCase() === valor.toLowerCase(),
    );
    if (existe) return;
    const indiceOtro = this.opciones.findIndex(
      (o) => o.trim().toLowerCase() === 'otro',
    );
    if (indiceOtro !== -1) {
      this.opciones.splice(indiceOtro, 0, valor);
    } else {
      this.opciones.push(valor);
    }
    this.nuevaOpcion = '';
  }

  quitarOpcion(indice: number): void {
    const opcion = this.opciones[indice];
    this.opciones.splice(indice, 1);
    if (opcion?.trim().toLowerCase() === 'otro') {
      this.permitirOtro = false;
    }
  }

  onToggleOtro(): void {
    this.permitirOtro = !this.permitirOtro;
    if (this.permitirOtro) {
      const yaExiste = this.opciones.some(
        (o) => o.trim().toLowerCase() === 'otro',
      );
      if (!yaExiste) this.opciones.push('Otro');
    } else {
      this.opciones = this.opciones.filter(
        (o) => o.trim().toLowerCase() !== 'otro',
      );
    }
  }

  puedeConfirmar(): boolean {
    if (!this.field_name.trim()) return false;
    if (this.esEdicion) return true;
    if (this.habitosMarcadosList.length === 0) return false;
    if (this.esNumerico) return this.unidad.trim().length > 0;
    return this.opciones.length > 0;
  }

  private habitosDondeCrearSeccion(): string[] {
    if (!this.seccionEsNueva) return [];
    return this.habitosMarcadosList.filter((h) => {
      const secciones = this.seccionesPorHabito[h] ?? [];
      return !secciones.some(
        (s) => s.name.toLowerCase() === this.section.toLowerCase(),
      );
    });
  }

  onConfirmar(): void {
    if (!this.puedeConfirmar()) return;
    this.confirmar.emit({
      section: this.section,
      field_name: this.field_name.trim(),
      selection_type: this.selection_type,
      field_type: this.field_type,
      is_required: this.is_required,
      opciones: this.opciones,
      unidad: this.unidad.trim(),
      habitos: this.esEdicion ? this.habitosGemelos : this.habitosMarcadosList,
      aplicarEnOtros: this.aplicarEnOtros,
      crearSeccionEnHabitos: this.habitosDondeCrearSeccion(),
      agregarOtro: this.esEdicion && this.permitirOtro,
    });
  }

  onCerrar(): void {
    this.cerrar.emit();
  }
}