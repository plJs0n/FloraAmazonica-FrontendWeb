// funcionalidades/catalogo-base/componentes/bloque-catalogo/bloque-catalogo.ts

import { Component, EventEmitter, Input, Output, signal, ChangeDetectorRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

export interface ConfigCatalogo {
  seccion: string;
  etiquetaFamilia: string;
  etiquetaEspecie: string;
}

@Component({
  selector: 'app-bloque-catalogo',
  imports: [RouterLink, FormsModule],
  templateUrl: './bloque-catalogo.html',
  styleUrl: './bloque-catalogo.css',
})
export class BloqueCatalogo {
  private cdr = inject(ChangeDetectorRef);

  @Input() config: ConfigCatalogo = {
    seccion: 'Identificación',
    etiquetaFamilia: 'Familia botánica',
    etiquetaEspecie: 'Nombre científico',
  };

  @Output() guardar = new EventEmitter<ConfigCatalogo>();

  editando = signal(false);

  // Copia temporal para editar sin mutar el input directamente
  borrador: ConfigCatalogo = {
    seccion: '',
    etiquetaFamilia: '',
    etiquetaEspecie: '',
  };

  abrirEdicion(): void {
    this.borrador = { ...this.config };
    this.editando.set(true);
    this.refrescar();
  }

  cancelar(): void {
    this.borrador = {
      seccion: '',
      etiquetaFamilia: '',
      etiquetaEspecie: '',
    };

    this.editando.set(false);
    this.refrescar();
  }

  confirmar(): void {
    const datosGuardados: ConfigCatalogo = {
      seccion: this.borrador.seccion.trim(),
      etiquetaFamilia: this.borrador.etiquetaFamilia.trim(),
      etiquetaEspecie: this.borrador.etiquetaEspecie.trim(),
    };

    if (
      !datosGuardados.seccion ||
      !datosGuardados.etiquetaFamilia ||
      !datosGuardados.etiquetaEspecie
    ) {
      return;
    }

    this.guardar.emit(datosGuardados);

    this.borrador = {
      seccion: '',
      etiquetaFamilia: '',
      etiquetaEspecie: '',
    };

    this.editando.set(false);
    this.refrescar();
  }

  private refrescar(): void {
    this.cdr.detectChanges();
  }
}