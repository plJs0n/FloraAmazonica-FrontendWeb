import { Usuario } from '../../../core/modelos/usuario.modelo';

export type RolUsuario = 'administrador' | 'registrador' | 'validador' | 'consultor';

export interface UsuarioAdmin extends Usuario {
  created_at: string;
  updated_at: string;
}

export interface ActualizarRolPayload {
  role: RolUsuario;
}

export interface FiltroUsuarios {
  rol: RolUsuario | 'todos';
  estado: 'todos' | 'activos' | 'inactivos';
  busqueda: string;
}