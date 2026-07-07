import {
  Component,
  OnInit,
  signal,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  PerfilService,
  PerfilUsuario,
  ActualizarPerfilDto,
} from '../../servicios/perfil.service';
import {
  ModalEditarCampo,
  CampoEditable,
} from '../../componentes/modal-editar-campo/modal-editar-campo';
import { ModalCambiarContrasena } from '../../componentes/modal-cambiar-contrasena/modal-cambiar-contrasena';

type ClavePerfilEditable =
  | 'first_name'
  | 'paternal_last_name'
  | 'maternal_last_name'
  | 'email';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, ModalEditarCampo, ModalCambiarContrasena],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css',
})
export class MiPerfil implements OnInit {
  private perfilService = inject(PerfilService);
  private cdr = inject(ChangeDetectorRef);

  perfil = signal<PerfilUsuario | null>(null);
  cargando = signal(true);
  error = signal('');

  campoActivo = signal<CampoEditable | null>(null);
  modalContrasenaAbierto = signal(false);

  toast = signal<{ mensaje: string; tipo: 'exito' | 'error' } | null>(null);

  readonly etiquetaRol: Partial<Record<string, string>> = {
    administrador: 'Administrador',
    validador: 'Validador',
    registrador: 'Registrador',
    consultor: 'Consultor',
  };

  ngOnInit(): void {
    this.cargarPerfil();
  }

  cargarPerfil(): void {
    this.cargando.set(true);
    this.error.set('');

    this.perfilService.obtenerPerfil().subscribe({
      next: (data) => {
        this.perfil.set(data);
        this.cargando.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar perfil:', err);

        if (err.status === 401) {
          this.error.set('Tu sesión no es válida o ha expirado.');
        } else if (err.status === 404) {
          this.error.set('El endpoint del perfil no existe en el backend.');
        } else if (err.status === 0) {
          this.error.set('No hay conexión con el servidor.');
        } else {
          this.error.set('No se pudo cargar el perfil.');
        }

        this.cargando.set(false);
        this.cdr.detectChanges();
      },
    });
  }

  abrirEdicion(clave: ClavePerfilEditable): void {
    const p = this.perfil();
    if (!p) return;

    const config: Record<ClavePerfilEditable, CampoEditable> = {
      first_name: {
        etiqueta: 'Nombres',
        clave: 'first_name',
        valor: p.first_name,
        tipo: 'text',
      },
      paternal_last_name: {
        etiqueta: 'Apellido paterno',
        clave: 'paternal_last_name',
        valor: p.paternal_last_name,
        tipo: 'text',
      },
      maternal_last_name: {
        etiqueta: 'Apellido materno',
        clave: 'maternal_last_name',
        valor: p.maternal_last_name ?? '',
        tipo: 'text',
        opcional: true,
      },
      email: {
        etiqueta: 'Correo electrónico',
        clave: 'email',
        valor: p.email,
        tipo: 'email',
      },
    };

    this.campoActivo.set(config[clave]);
  }

  onConfirmarEdicion(evento: { clave: string; valor: string }): void {
    const p = this.perfil();
    if (!p) return;

    const payload = {
      [evento.clave]: evento.valor,
    } as ActualizarPerfilDto;

    this.perfilService.actualizarPerfil(payload).subscribe({
      next: (actualizado) => {
        this.perfil.set(actualizado);
        this.campoActivo.set(null);
        this.mostrarToast('Datos actualizados correctamente.', 'exito');
        this.cdr.detectChanges();
      },
      error: (err) => {
        const msg = err?.error?.message;

        if (
          msg?.toLowerCase().includes('email') ||
          msg?.toLowerCase().includes('correo')
        ) {
          this.mostrarToast('Ese correo ya está en uso.', 'error');
        } else {
          this.mostrarToast('No se pudo guardar el cambio.', 'error');
        }

        this.cdr.detectChanges();
      },
    });
  }

  onExitoContrasena(): void {
    this.modalContrasenaAbierto.set(false);
    this.mostrarToast('Contraseña actualizada correctamente.', 'exito');
  }

  obtenerEtiquetaRol(rol: string): string {
    return this.etiquetaRol[rol] ?? rol;
  }

  private mostrarToast(mensaje: string, tipo: 'exito' | 'error'): void {
    this.toast.set({ mensaje, tipo });

    setTimeout(() => {
      this.toast.set(null);
      this.cdr.detectChanges();
    }, 3500);
  }

  get inicialesAvatar(): string {
    const p = this.perfil();

    if (!p) return '?';

    return (
      (p.first_name?.[0] ?? '') + (p.paternal_last_name?.[0] ?? '')
    ).toUpperCase();
  }

  get nombreCompleto(): string {
    const p = this.perfil();

    if (!p) return '';

    return [p.first_name, p.paternal_last_name, p.maternal_last_name]
      .filter(Boolean)
      .join(' ');
  }
}