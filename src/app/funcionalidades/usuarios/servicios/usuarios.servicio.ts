import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { UsuarioAdmin, ActualizarRolPayload } from '../modelos/usuario-admin.modelo';

@Injectable({ providedIn: 'root' })
export class UsuariosServicio {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/usuarios`;

  listarTodos() {
    return this.http.get<UsuarioAdmin[]>(this.baseUrl);
  }

  cambiarActivacion(id: string, is_active: boolean) {
    return this.http.patch<UsuarioAdmin>(`${this.baseUrl}/${id}/activar`, { is_active });
  }

  actualizarRol(id: string, payload: ActualizarRolPayload) {
    return this.http.patch<UsuarioAdmin>(`${this.baseUrl}/${id}/rol`, payload);
  }

  eliminarSolicitud(id: string) {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }
}