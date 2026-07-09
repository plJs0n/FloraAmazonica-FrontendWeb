import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  FichaRegistro,
  RegistroPendiente,
  PaginatedResult,
  ChangeStatusPayload,
  EstadoRegistro,
  ValorMorfologico,
} from '../modelos/validacion.models';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ValidacionService {
  private readonly base = `${environment.apiUrl}/validacion`;
  private readonly baseMorfologia = `${environment.apiUrl}/morfologia`;

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

  /**
   * Estructura morfológica del catálogo por hábito.
   * Devuelve todas las filas de morphological_values de ese hábito,
   * cada una con su section, field_name y display_order.
   * Se usa para agrupar el morphological_data plano del registro por sección.
   */
  getEstructuraMorfologica(habit: string): Observable<ValorMorfologico[]> {
    const params = new HttpParams().set('habit', habit);
    return this.http.get<ValorMorfologico[]>(this.baseMorfologia, { params });
  }
}