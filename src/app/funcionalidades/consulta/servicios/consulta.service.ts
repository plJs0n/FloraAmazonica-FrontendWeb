import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  FiltroMorfologico,
  ResultadoBusqueda,
  EspecieRegistro,
  Distribucion,
} from '../modelos/consulta.models';

@Injectable({
  providedIn: 'root',
})
export class ConsultaService {
  private readonly base = `${environment.apiUrl}/catalogo`;

  constructor(private http: HttpClient) {}

  getFiltros(habit?: string): Observable<FiltroMorfologico[]> {
    let params = new HttpParams();

    if (habit) {
      params = params.set('habit', habit);
    }

    return this.http.get<FiltroMorfologico[]>(`${this.base}/filtros`, {
      params,
    });
  }

  buscar(opciones: {
    habit?: string;
    q?: string;
    filtros?: Record<string, string>;
    page?: number;
    limit?: number;
  }): Observable<ResultadoBusqueda> {
    let params = new HttpParams()
      .set('page', opciones.page ?? 1)
      .set('limit', opciones.limit ?? 20);

    if (opciones.habit) {
      params = params.set('habit', opciones.habit);
    }

    if (opciones.q) {
      params = params.set('q', opciones.q);
    }

    for (const [slug, valor] of Object.entries(opciones.filtros ?? {})) {
      if (valor) {
        params = params.set(slug, valor);
      }
    }

    return this.http.get<ResultadoBusqueda>(`${this.base}/buscar`, {
      params,
    });
  }

  getFicha(id: string): Observable<EspecieRegistro> {
    return this.http.get<EspecieRegistro>(`${this.base}/${id}`);
  }

  getDistribucion(id: string): Observable<Distribucion> {
    return this.http.get<Distribucion>(`${this.base}/${id}/distribucion`);
  }

  descargarFoto(id: string, fotoId: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.base}/${id}/fotos/${fotoId}/descargar`, {
      responseType: 'blob',
      observe: 'response',
    });
  }

  toSlug(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  getSugerencias(q: string): Observable<string[]> {
    const params = new HttpParams().set('q', q);
    return this.http.get<string[]>(`${this.base}/sugerencias`, { params });
  }
}