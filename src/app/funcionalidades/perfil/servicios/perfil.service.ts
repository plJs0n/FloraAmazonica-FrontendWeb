import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PerfilUsuario {
  id: string;
  first_name: string;
  paternal_last_name: string;
  maternal_last_name: string | null;
  email: string;
  role: string;
  is_active: boolean;
}

export interface ActualizarPerfilDto {
  first_name?: string;
  paternal_last_name?: string;
  maternal_last_name?: string;
  email?: string;
}

export interface CambiarContrasenaDto {
  current_password: string;
  new_password: string;
}

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  obtenerPerfil(): Observable<PerfilUsuario> {
    return this.http.get<PerfilUsuario>(`${this.base}/usuarios/perfil`);
  }

  actualizarPerfil(datos: ActualizarPerfilDto): Observable<PerfilUsuario> {
    return this.http.patch<PerfilUsuario>(
      `${this.base}/usuarios/perfil`,
      datos
    );
  }

  cambiarContrasena(datos: CambiarContrasenaDto): Observable<void> {
    return this.http.patch<void>(
      `${this.base}/usuarios/perfil/contrasena`,
      datos
    );
  }
}