// funcionalidades/catalogo-base/componentes/modal-opcion/modal-opcion.ts

import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface ResultadoModalOpcion {
  valor: string;
}

@Component({
  selector: 'app-modal-opcion',
  imports: [FormsModule],
  templateUrl: './modal-opcion.html',
  styleUrl: './modal-opcion.css',
})
export class ModalOpcion implements OnInit {
  @Input() valorInicial: string = '';
  @Input() titulo: string = 'Nueva opción';

  @Output() confirmar = new EventEmitter<ResultadoModalOpcion>();
  @Output() cerrar = new EventEmitter<void>();

  valor = '';

  ngOnInit(): void {
    this.valor = this.valorInicial;
  }

  puedeConfirmar(): boolean {
    return this.valor.trim().length > 0;
  }

  onConfirmar(): void {
    if (!this.puedeConfirmar()) return;
    this.confirmar.emit({ valor: this.valor.trim() });
  }

  onCerrar(): void {
    this.cerrar.emit();
  }
}