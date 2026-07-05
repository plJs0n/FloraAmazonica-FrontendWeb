import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UsuarioAdmin, RolUsuario } from '../../modelos/usuario-admin.modelo';

@Component({
  selector: 'app-tarjeta-usuario',
  imports: [],
  templateUrl: './tarjeta-usuario.html',
  styleUrl: './tarjeta-usuario.css'
})
export class TarjetaUsuario {
  @Input({ required: true }) usuario!: UsuarioAdmin;
  @Input() esMiCuenta = false;

  @Output() cambiarEstado = new EventEmitter<UsuarioAdmin>();
  @Output() cambiarRol = new EventEmitter<{ usuario: UsuarioAdmin; rol: RolUsuario }>();

  readonly rolesDisponibles: RolUsuario[] = ['administrador', 'registrador', 'validador', 'consultor'];

  alCambiarEstado(): void {
    if (this.esMiCuenta) return;
    this.cambiarEstado.emit(this.usuario);
  }

  alCambiarRol(evento: Event): void {
    const rol = (evento.target as HTMLSelectElement).value as RolUsuario;
    if (rol !== this.usuario.role) {
      this.cambiarRol.emit({ usuario: this.usuario, rol });
    }
  }
}