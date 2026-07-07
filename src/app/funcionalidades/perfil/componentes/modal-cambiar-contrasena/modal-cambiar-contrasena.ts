import {
  Component,
  Output,
  EventEmitter,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PerfilService } from '../../servicios/perfil.service';

@Component({
  selector: 'app-modal-cambiar-contrasena',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-cambiar-contrasena.html',
  styleUrl: './modal-cambiar-contrasena.css',
})
export class ModalCambiarContrasena {
  @Output() cerrar = new EventEmitter<void>();
  @Output() exito = new EventEmitter<void>();

  private perfilService = inject(PerfilService);

  contrasenaActual = signal('');
  nuevaContrasena = signal('');
  confirmarContrasena = signal('');

  mostrarActual = signal(false);
  mostrarNueva = signal(false);
  mostrarConfirmar = signal(false);

  cargando = signal(false);
  error = signal('');

  onGuardar(): void {
    this.error.set('');

    const actual = this.contrasenaActual().trim();
    const nueva = this.nuevaContrasena();
    const confirmacion = this.confirmarContrasena();

    if (!actual) {
      this.error.set('Ingresa tu contraseña actual.');
      return;
    }

    if (!nueva) {
      this.error.set('Ingresa tu nueva contraseña.');
      return;
    }

    if (nueva.length < 8) {
      this.error.set('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (!/(?=.*[A-Z])/.test(nueva)) {
      this.error.set('La nueva contraseña debe contener al menos una mayúscula.');
      return;
    }

    if (!/(?=.*\d)/.test(nueva)) {
      this.error.set('La nueva contraseña debe contener al menos un número.');
      return;
    }

    if (nueva !== confirmacion) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }

    this.cargando.set(true);

    this.perfilService
      .cambiarContrasena({
        current_password: actual,
        new_password: nueva,
      })
      .subscribe({
        next: () => {
          this.cargando.set(false);
          this.exito.emit();
        },
        error: (err) => {
          this.cargando.set(false);

          const msg = err?.error?.message;

          if (
            msg?.toLowerCase().includes('incorrect') ||
            msg?.toLowerCase().includes('incorrecta')
          ) {
            this.error.set('La contraseña actual es incorrecta.');
          } else {
            this.error.set('No se pudo cambiar la contraseña. Intenta de nuevo.');
          }
        },
      });
  }

  onOverlayClick(event: MouseEvent): void {
    const elemento = event.target as HTMLElement;

    if (elemento.classList.contains('overlay')) {
      this.cerrar.emit();
    }
  }
}