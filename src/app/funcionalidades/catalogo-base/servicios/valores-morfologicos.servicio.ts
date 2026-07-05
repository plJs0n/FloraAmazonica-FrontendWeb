// funcionalidades/catalogo-base/servicios/valores-morfologicos.servicio.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ValorMorfologico,
  CrearValorMorfologico,
  ActualizarValorMorfologico,
  CampoMorfologico,
  TipoSeleccion,
} from '../modelos/valor-morfologico.modelo';

@Injectable({ providedIn: 'root' })
export class ValoresMorfologicosServicio {
  private http = inject(HttpClient);
  private urlBase = `${environment.apiUrl}/morfologia`;

  // ---- Peticiones al backend ----

  /** GET /morfologia?habit= — lista plana de un hábito */
  listarPorHabito(habit: string): Observable<ValorMorfologico[]> {
    return this.http.get<ValorMorfologico[]>(this.urlBase, {
      params: { habit },
    });
  }

  /** POST /morfologia — crea una opción */
  crear(dto: CrearValorMorfologico): Observable<ValorMorfologico> {
    return this.http.post<ValorMorfologico>(this.urlBase, dto);
  }

  /** PATCH /morfologia/:id — edita una opción */
  actualizar(id: string, dto: ActualizarValorMorfologico): Observable<ValorMorfologico> {
    return this.http.patch<ValorMorfologico>(`${this.urlBase}/${id}`, dto);
  }

  /** PATCH /morfologia/:id/estado — activa o desactiva una opción */
  cambiarEstado(id: string, is_active: boolean): Observable<ValorMorfologico> {
    return this.http.patch<ValorMorfologico>(`${this.urlBase}/${id}/estado`, { is_active });
  }

  // ---- Operaciones compuestas (varias llamadas en paralelo) ----

  /**
   * Crea el mismo campo (con sus opciones) en varios hábitos a la vez.
   * El backend no tiene endpoint bulk, así que se generan N peticiones POST
   * (una por cada opción y por cada hábito) y se ejecutan en paralelo.
   */
  crearEnHabitos(
    habitos: string[],
    base: Omit<CrearValorMorfologico, 'habit' | 'option_value'>,
    opciones: string[],
  ): Observable<ValorMorfologico[]> {
    const peticiones: Observable<ValorMorfologico>[] = [];
    for (const habit of habitos) {
      opciones.forEach((opcion, indice) => {
        peticiones.push(
          this.crear({
            ...base,
            habit,
            option_value: opcion,
            display_order: base.display_order ?? indice,
          }),
        );
      });
    }
    return forkJoin(peticiones);
  }

  /**
   * Actualiza los metadatos de un campo (section, field_name, tipo, obligatorio)
   * en todas las opciones indicadas. Se usa al editar un campo que se replica
   * en varios hábitos: se pasan los ids de las opciones equivalentes.
   * Las opciones (option_value) NO se sincronizan aquí.
   */
  actualizarMetadatosCampo(
    ids: string[],
    metadatos: Pick<ActualizarValorMorfologico, 'section' | 'field_name' | 'selection_type' | 'field_type' | 'is_required'>,
  ): Observable<ValorMorfologico[]> {
    const peticiones = ids.map((id) => this.actualizar(id, metadatos));
    return forkJoin(peticiones);
  }

  /**
   * Reordena los campos de un hábito: recibe los grupos ya ordenados y
   * reescribe el display_order de todas sus opciones. Devuelve las peticiones
   * PATCH en paralelo.
   */
  guardarOrden(campos: CampoMorfologico[]): Observable<ValorMorfologico[]> {
    const peticiones: Observable<ValorMorfologico>[] = [];
    campos.forEach((campo, indice) => {
      campo.opciones.forEach((opcion) => {
        if (opcion.display_order !== indice) {
          peticiones.push(this.actualizar(opcion.id, { display_order: indice }));
        }
      });
    });
    return peticiones.length ? forkJoin(peticiones) : forkJoin([]);
  }

  // ---- Utilidades en memoria ----

  private normalizar(texto: string): string {
    return texto?.trim().toLowerCase() ?? '';
  }

  /** Clave que identifica un campo dentro de un hábito */
  claveCampo(section: string, field_name: string): string {
    return `${this.normalizar(section)}||${this.normalizar(field_name)}`;
  }

  /**
   * Agrupa la lista plana del backend en campos (field_name) con sus opciones.
   * Ordena por display_order y respeta el estado activo/inactivo.
   */
  agruparEnCampos(valores: ValorMorfologico[]): CampoMorfologico[] {
    const mapa = new Map<string, CampoMorfologico>();

    for (const v of valores) {
      const clave = this.claveCampo(v.section, v.field_name);
      let campo = mapa.get(clave);
      if (!campo) {
        campo = {
          clave,
          section: v.section,
          field_name: v.field_name,
          selection_type: v.selection_type,
          field_type: v.field_type,
          is_required: v.is_required,
          display_order: v.display_order,
          activo: false,
          opciones: [],
        };
        mapa.set(clave, campo);
      }
      campo.opciones.push(v);
      campo.display_order = Math.min(campo.display_order, v.display_order);
      if (v.is_active) campo.activo = true;
    }

    const campos = [...mapa.values()];
    for (const campo of campos) {
      campo.opciones.sort((a, b) => {
        const aEsOtro = a.option_value.trim().toLowerCase() === 'otro';
        const bEsOtro = b.option_value.trim().toLowerCase() === 'otro';
        if (aEsOtro) return 1;
        if (bEsOtro) return -1;
        return a.display_order - b.display_order;
      });
    }
    campos.sort((a, b) => a.display_order - b.display_order);
    return campos;
  }

  /**
   * Dado un campo de un hábito, indica en qué OTROS hábitos existe el mismo
   * campo (misma section + field_name normalizados). Requiere el mapa completo
   * de valores por hábito ya cargado.
   * Devuelve, por hábito, el id de la opción cuyo option_value coincide, para
   * poder aplicar ediciones compartidas opción por opción.
   */
  buscarCampoEnHabitos(
    section: string,
    field_name: string,
    valoresPorHabito: Record<string, ValorMorfologico[]>,
    habitoActual: string,
  ): string[] {
    const clave = this.claveCampo(section, field_name);
    const habitosCoincidentes: string[] = [];
    for (const habito of Object.keys(valoresPorHabito)) {
      if (habito === habitoActual) continue;
      const existe = valoresPorHabito[habito].some(
        (v) => this.claveCampo(v.section, v.field_name) === clave,
      );
      if (existe) habitosCoincidentes.push(habito);
    }
    return habitosCoincidentes;
  }

  /**
   * Busca la opción equivalente (mismo option_value normalizado) de un campo
   * dentro de otro hábito. Sirve para "editar esta opción en Árbol y Palmera":
   * localiza el id gemelo en cada hábito.
   */
  buscarOpcionGemela(
    section: string,
    field_name: string,
    option_value: string,
    valoresHabito: ValorMorfologico[],
  ): ValorMorfologico | undefined {
    const clave = this.claveCampo(section, field_name);
    const opcionNorm = this.normalizar(option_value);
    return valoresHabito.find(
      (v) =>
        this.claveCampo(v.section, v.field_name) === clave &&
        this.normalizar(v.option_value) === opcionNorm,
    );
  }

  /**
   * Valida en memoria si un option_value ya existe en el contexto
   * (habit + section + field_name), excluyendo un id si se está editando.
   * El backend también lo valida (409), esto evita el viaje innecesario.
   */
  existeDuplicado(
    valoresHabito: ValorMorfologico[],
    section: string,
    field_name: string,
    option_value: string,
    idExcluir?: string,
  ): boolean {
    const clave = this.claveCampo(section, field_name);
    const opcionNorm = this.normalizar(option_value);
    return valoresHabito.some(
      (v) =>
        v.id !== idExcluir &&
        this.claveCampo(v.section, v.field_name) === clave &&
        this.normalizar(v.option_value) === opcionNorm,
    );
  }
}