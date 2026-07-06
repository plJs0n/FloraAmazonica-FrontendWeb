import { Component, Input, Output, EventEmitter, OnInit, OnChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ValidacionService } from '../../servicios/validacion.service';
import { FichaRegistro } from '../../modelos/validacion.models';
import { ModalEstado } from '../../componentes/modal-estado';

@Component({
  selector: 'app-detalle-validacion',
  standalone: true,
  imports: [CommonModule, ModalEstado],
  templateUrl: './detalle-validacion.html',
  styleUrl: './detalle-validacion.css'
})
export class DetalleValidacion implements OnInit, OnChanges {
  @Input() registroId!: string;
  @Output() estadoActualizado = new EventEmitter<void>();

  ficha = signal<FichaRegistro | null>(null);
  cargando = signal(false);
  error = signal<string | null>(null);
  modalAbierto = signal(false);
  fotoActiva = signal<string | null>(null);

  constructor(private validacionService: ValidacionService) {}

  ngOnInit() {
    this.cargarFicha();
  }

  ngOnChanges() {
    this.cargarFicha();
  }

  cargarFicha() {
    if (!this.registroId) return;
    this.cargando.set(true);
    this.error.set(null);
    this.ficha.set(null);
    this.validacionService.getFicha(this.registroId).subscribe({
      next: (res) => {
        this.ficha.set(res);
        const primera = res.photos?.[0]?.cloudinary_url ?? null;
        this.fotoActiva.set(primera);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la ficha del registro.');
        this.cargando.set(false);
      }
    });
  }

  abrirModal() {
    this.modalAbierto.set(true);
  }

  cerrarModal() {
    this.modalAbierto.set(false);
  }

  onEstadoCambiado() {
    this.cerrarModal();
    this.cargarFicha();
    this.estadoActualizado.emit();
  }

  seleccionarFoto(url: string) {
    this.fotoActiva.set(url);
  }

  getEtiquetaHabito(habit: string): string {
    const map: Record<string, string> = {
      arbol: 'Árbol',
      palmera: 'Palmera',
      arbusto: 'Arbusto',
      liana: 'Liana',
      hierba: 'Hierba',
    };
    return map[habit] ?? habit;
  }

  getEtiquetaFoto(tipo: string): string {
    const map: Record<string, string> = {
      planta_completa: 'Planta completa',
      hoja: 'Hoja',
      flor: 'Flor',
      fruto: 'Fruto',
      tallo_corteza: 'Tallo y corteza',
    };
    return map[tipo] ?? tipo;
  }

  getMorfologiaEntradas(): { seccion: string; campos: { campo: string; valor: any }[] }[] {
    const data = this.ficha()?.morphological_data;
    if (!data) return [];
    return Object.entries(data).map(([seccion, campos]) => ({
      seccion,
      campos: typeof campos === 'object' && !Array.isArray(campos)
        ? Object.entries(campos).map(([campo, valor]) => ({ campo, valor }))
        : [{ campo: seccion, valor: campos }]
    }));
  }

  formatearValor(valor: any): string {
    if (Array.isArray(valor)) return valor.join(', ');
    if (valor === null || valor === undefined) return '—';
    return String(valor);
  }
}