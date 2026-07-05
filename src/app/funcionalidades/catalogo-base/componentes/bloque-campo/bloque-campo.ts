// funcionalidades/catalogo-base/componentes/bloque-campo/bloque-campo.ts

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CampoMorfologico, ValorMorfologico } from '../../modelos/valor-morfologico.modelo';

@Component({
  selector: 'app-bloque-campo',
  imports: [],
  templateUrl: './bloque-campo.html',
  styleUrl: './bloque-campo.css',
})
export class BloqueCampo {
  @Input() campo!: CampoMorfologico;

  @Output() editarCampo = new EventEmitter<CampoMorfologico>();
  @Output() alternarCampo = new EventEmitter<CampoMorfologico>();
  @Output() agregarOpcion = new EventEmitter<CampoMorfologico>();
  @Output() editarOpcion = new EventEmitter<ValorMorfologico>();
  @Output() alternarOpcion = new EventEmitter<ValorMorfologico>();

  onEditarCampo(): void {
    this.editarCampo.emit(this.campo);
  }

  onAlternarCampo(): void {
    this.alternarCampo.emit(this.campo);
  }

  onAgregarOpcion(): void {
    this.agregarOpcion.emit(this.campo);
  }

  onEditarOpcion(opcion: ValorMorfologico): void {
    this.editarOpcion.emit(opcion);
  }

  onAlternarOpcion(opcion: ValorMorfologico): void {
    this.alternarOpcion.emit(opcion);
  }
}