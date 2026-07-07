import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface CampoEditable {
  etiqueta: string;
  clave: string;
  valor: string;
  tipo?: 'text' | 'email';
  opcional?: boolean;
}

@Component({
  selector: 'app-modal-editar-campo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-editar-campo.html',
  styleUrl: './modal-editar-campo.css',
})
export class ModalEditarCampo implements OnInit {
  @Input({ required: true }) campo!: CampoEditable;

  @Output() cerrar = new EventEmitter<void>();
  @Output() confirmar = new EventEmitter<{ clave: string; valor: string }>();

  nuevoValor = signal('');
  error = signal('');

  ngOnInit(): void {
    this.nuevoValor.set(this.campo?.valor ?? '');
  }

  onConfirmar(): void {
    this.error.set('');

    const valor = this.nuevoValor().trim();

    if (!this.campo.opcional && !valor) {
      this.error.set(`${this.campo.etiqueta} es obligatorio.`);
      return;
    }

    if (this.campo.tipo === 'email' && valor && !this.esCorreoValido(valor)) {
      this.error.set('Ingresa un correo electrónico válido.');
      return;
    }

    this.confirmar.emit({
      clave: this.campo.clave,
      valor,
    });
  }

  onOverlayClick(event: MouseEvent): void {
    const elemento = event.target as HTMLElement;

    if (elemento.classList.contains('overlay')) {
      this.cerrar.emit();
    }
  }

  private esCorreoValido(valor: string): boolean {
    const expresion = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return expresion.test(valor);
  }
}
