import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FichaRegistro, RegistroPendiente, PaginatedResult, ChangeStatusPayload, EstadoRegistro } from '../modelos/validacion.models';

@Injectable({ providedIn: 'root' })
export class ValidacionService {
  private readonly base = 'http://localhost:3000/validacion';

  constructor(private http: HttpClient) {}

  getPendientes(page = 1, limit = 20, status?: EstadoRegistro): Observable<PaginatedResult<RegistroPendiente>> {
    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit);
    if (status) params = params.set('status', status);
    return this.http.get<PaginatedResult<RegistroPendiente>>(`${this.base}/pendientes`, { params });
  }

  getFicha(id: string): Observable<FichaRegistro> {
    return this.http.get<FichaRegistro>(`${this.base}/${id}`);
  }

  cambiarEstado(id: string, payload: ChangeStatusPayload): Observable<FichaRegistro> {
    return this.http.patch<FichaRegistro>(`${this.base}/${id}/estado`, payload);
  }
}