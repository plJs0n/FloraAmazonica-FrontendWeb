import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ValidacionService } from '../servicios/validacion.service';
import { EstadoRegistro, ChangeStatusPayload } from '../modelos/validacion.models';

@Component({
  selector: 'app-modal-estado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-estado.html',
  styleUrl: './modal-estado.css'
})
export class ModalEstado {
  @Input() registroId!: string;
  @Input() estadoActual!: EstadoRegistro;
  @Output() cerrar = new EventEmitter<void>();
  @Output() estadoCambiado = new EventEmitter<void>();

  estadoSeleccionado = signal<EstadoRegistro | null>(null);
  observacionNota = signal('');
  guardando = signal(false);
  error = signal<string | null>(null);

  readonly opciones: { valor: EstadoRegistro; etiqueta: string; descripcion: string }[] = [
    { valor: 'en_revision', etiqueta: 'En revisión', descripcion: 'El registro está siendo revisado.' },
    { valor: 'observado', etiqueta: 'Observado', descripcion: 'El registro requiere correcciones. El motivo es obligatorio.' },
    { valor: 'validado', etiqueta: 'Validado', descripcion: 'El registro es correcto y se publicará automáticamente.' },
    { valor: 'rechazado', etiqueta: 'Rechazado', descripcion: 'El registro no cumple los criterios. El motivo es obligatorio.' },
  ];

  requiereNota(): boolean {
    const e = this.estadoSeleccionado();
    return e === 'observado' || e === 'rechazado';
  }

  puedeGuardar(): boolean {
    if (!this.estadoSeleccionado()) return false;
    if (this.estadoSeleccionado() === this.estadoActual) return false;
    if (this.requiereNota() && !this.observacionNota().trim()) return false;
    return true;
  }

  seleccionar(estado: EstadoRegistro) {
    this.estadoSeleccionado.set(estado);
    this.error.set(null);
    if (!this.requiereNota()) this.observacionNota.set('');
  }

  guardar() {
    if (!this.puedeGuardar()) return;
    this.guardando.set(true);
    this.error.set(null);

    const payload: ChangeStatusPayload = {
      status: this.estadoSeleccionado()!,
      ...(this.requiereNota() && { observation_notes: this.observacionNota().trim() })
    };

    this.validacionService.cambiarEstado(this.registroId, payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.estadoCambiado.emit();
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo actualizar el estado.');
      }
    });
  }

  constructor(private validacionService: ValidacionService) {}
}