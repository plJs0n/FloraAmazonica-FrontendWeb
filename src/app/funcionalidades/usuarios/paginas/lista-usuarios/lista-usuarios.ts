import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { UsuariosServicio } from '../../servicios/usuarios.servicio';
import { AutenticacionServicio } from '../../../../core/servicios/autenticacion.servicio';
import { UsuarioAdmin, RolUsuario, FiltroUsuarios } from '../../modelos/usuario-admin.modelo';
import { TarjetaUsuario } from '../../componentes/tarjeta-usuario/tarjeta-usuario';
import { ModalSolicitudes } from '../../componentes/modal-solicitudes/modal-solicitudes';

const FILTRO_INICIAL: FiltroUsuarios = {
  rol: 'todos',
  estado: 'todos',
  busqueda: '',
};

@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  imports: [TarjetaUsuario, ModalSolicitudes],
  templateUrl: './lista-usuarios.html',
  styleUrl: './lista-usuarios.css',
})
export class ListaUsuarios implements OnInit {
  private usuariosServicio = inject(UsuariosServicio);
  private autenticacionServicio = inject(AutenticacionServicio);

  usuarios = signal<UsuarioAdmin[]>([]);
  solicitudes = signal<UsuarioAdmin[]>([]);
  filtro = signal<FiltroUsuarios>(FILTRO_INICIAL);
  modalSolicitudesAbierto = signal(false);
  cargandoLista = signal(true);

  usuariosFiltrados = computed(() => {
    const { rol, estado, busqueda } = this.filtro();
    const termino = busqueda.trim().toLowerCase();

    return this.usuarios()
      .filter((u) => u.status !== 'pendiente')
      .filter((u) => rol === 'todos' || u.role === rol)
      .filter((u) => {
        if (estado === 'todos') return true;
        return estado === 'activos' ? u.status === 'activo' : u.status === 'inactivo';
      })
      .filter((u) => {
        if (!termino) return true;
        return (
          `${u.first_name} ${u.paternal_last_name} ${u.maternal_last_name ?? ''}`
            .toLowerCase()
            .includes(termino) || u.email.toLowerCase().includes(termino)
        );
      });
  });

  totalSolicitudes = computed(() => this.solicitudes().length);

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.cargandoLista.set(true);
    this.usuariosServicio.listarTodos().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios.filter((u) => u.status !== 'pendiente'));
        this.solicitudes.set(usuarios.filter((u) => u.status === 'pendiente'));
        this.cargandoLista.set(false);
      },
      error: () => this.cargandoLista.set(false),
    });
  }

  onCambiarBusqueda(evento: Event) {
    const busqueda = (evento.target as HTMLInputElement).value;
    this.filtro.update((f) => ({ ...f, busqueda }));
  }

  onCambiarFiltroRol(evento: Event) {
    const rol = (evento.target as HTMLSelectElement).value as RolUsuario | 'todos';
    this.filtro.update((f) => ({ ...f, rol }));
  }

  onCambiarFiltroEstado(evento: Event) {
    const estado = (evento.target as HTMLSelectElement).value as FiltroUsuarios['estado'];
    this.filtro.update((f) => ({ ...f, estado }));
  }

  abrirSolicitudes() {
    this.modalSolicitudesAbierto.set(true);
  }

  cerrarSolicitudes() {
    this.modalSolicitudesAbierto.set(false);
  }

  onSolicitudConfirmada() {
    this.cargarUsuarios();
  }

  onSolicitudEliminada(id: string) {
    this.solicitudes.update((lista) => lista.filter((u) => u.id !== id));
  }

  onCambiarEstado(usuario: UsuarioAdmin) {
    const usuarioActual = this.autenticacionServicio.obtenerUsuario();
    if (usuarioActual?.id === usuario.id) return;

    const nuevoEstado = usuario.status === 'activo' ? false : true;
    this.usuariosServicio.cambiarActivacion(usuario.id, nuevoEstado).subscribe({
      next: (actualizado) => this.reemplazarUsuario(actualizado),
    });
  }

  onCambiarRol(evento: { usuario: UsuarioAdmin; rol: RolUsuario }) {
    this.usuariosServicio.actualizarRol(evento.usuario.id, { role: evento.rol }).subscribe({
      next: (actualizado) => this.reemplazarUsuario(actualizado),
    });
  }

  obtenerIdActual(): string | null {
    return this.autenticacionServicio.obtenerUsuario()?.id ?? null;
  }

  private reemplazarUsuario(actualizado: UsuarioAdmin) {
    this.usuarios.update((lista) =>
      lista.map((u) => (u.id === actualizado.id ? actualizado : u)),
    );
  }
}