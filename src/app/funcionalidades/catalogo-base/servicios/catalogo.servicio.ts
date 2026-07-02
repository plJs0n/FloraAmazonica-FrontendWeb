import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ActualizarEspecieDto,
  EspecieCatalogo,
  ModoImportacion,
  ResultadoImportacion,
} from '../modelos/especie-catalogo.modelo';

@Injectable({ providedIn: 'root' })
export class CatalogoServicio {
  private readonly base = `${environment.apiUrl}/catalogo`;

  constructor(private http: HttpClient) {}

  previsualizarImportacion(archivo: File, modo: ModoImportacion): Observable<ResultadoImportacion> {
    const form = new FormData();
    form.append('file', archivo);
    form.append('mode', modo);
    return this.http.post<ResultadoImportacion>(`${this.base}/importar/preview`, form);
  }

  importar(archivo: File, modo: ModoImportacion): Observable<ResultadoImportacion> {
    const form = new FormData();
    form.append('file', archivo);
    form.append('mode', modo);
    return this.http.post<ResultadoImportacion>(`${this.base}/importar`, form);
  }

  listarEspecies(busqueda?: string): Observable<EspecieCatalogo[]> {
    let params = new HttpParams();
    if (busqueda) params = params.set('search', busqueda);
    return this.http.get<EspecieCatalogo[]>(`${this.base}/especies`, { params });
  }

  editarEspecie(id: string, dto: ActualizarEspecieDto): Observable<EspecieCatalogo> {
    return this.http.patch<EspecieCatalogo>(`${this.base}/especies/${id}`, dto);
  }

  cambiarEstadoEspecie(id: string, is_active: boolean): Observable<EspecieCatalogo> {
    return this.http.patch<EspecieCatalogo>(`${this.base}/especies/${id}/estado`, { is_active });
  }
}