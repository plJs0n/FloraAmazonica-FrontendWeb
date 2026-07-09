import { Component, Input, Output, EventEmitter, OnInit, OnChanges, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ValidacionService } from '../../servicios/validacion.service';
import { FichaRegistro, ValorMorfologico } from '../../modelos/validacion.models';
import { ModalEstado } from '../../componentes/modal-estado';
import { MapaRegistro } from '../../../../shared/componentes/mapa-registro/mapa-registro';

interface CampoMorfologico {
  campo: string;
  etiqueta: string;
  valor: any;
}

interface SeccionMorfologica {
  seccion: string;
  campos: CampoMorfologico[];
}

@Component({
  selector: 'app-detalle-validacion',
  standalone: true,
  imports: [CommonModule, ModalEstado, MapaRegistro],
  templateUrl: './detalle-validacion.html',
  styleUrl: './detalle-validacion.css'
})
export class DetalleValidacion implements OnInit, OnChanges {
  @Input() registroId!: string;
  @Output() estadoActualizado = new EventEmitter<void>();

  ficha = signal<FichaRegistro | null>(null);
  cargando = signal(false);
  error = signal<string | null>(null);
  modalAbierto = signal(false);
  fotoActiva = signal<string | null>(null);

  // Estructura morfológica del catálogo (para agrupar por sección)
  estructura = signal<ValorMorfologico[]>([]);
  // Secciones que el usuario tiene expandidas en el acordeón
  seccionesAbiertas = signal<Set<string>>(new Set());

  constructor(
    private validacionService: ValidacionService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.cargarFicha();
  }

  ngOnChanges() {
    this.cargarFicha();
  }

  cargarFicha() {
    if (!this.registroId) return;
    this.cargando.set(true);
    this.error.set(null);
    this.ficha.set(null);
    this.estructura.set([]);
    this.validacionService.getFicha(this.registroId).subscribe({
      next: (res) => {
        this.ficha.set(res);
        const primera = res.photos?.[0]?.cloudinary_url ?? null;
        this.fotoActiva.set(primera);
        this.cargando.set(false);
        this.cdr.detectChanges();
        // Una vez tenemos el hábito, pedimos la estructura para agrupar por sección
        this.cargarEstructura(res.habit);
      },
      error: () => {
        this.error.set('No se pudo cargar la ficha del registro.');
        this.cargando.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Trae la estructura morfológica del hábito para saber a qué sección
   * pertenece cada field_name. Si falla, se usa el fallback (todo en una
   * sola sección general).
   */
  private cargarEstructura(habit: string) {
    if (!habit) return;
    this.validacionService.getEstructuraMorfologica(habit).subscribe({
      next: (valores) => {
        this.estructura.set(valores ?? []);
        // Abrimos todas las secciones por defecto
        const secciones = new Set(this.getMorfologiaEntradas().map((s) => s.seccion));
        this.seccionesAbiertas.set(secciones);
        this.cdr.detectChanges();
      },
      error: () => {
        // Sin estructura: el fallback agrupa todo en "Características morfológicas"
        this.estructura.set([]);
        const secciones = new Set(this.getMorfologiaEntradas().map((s) => s.seccion));
        this.seccionesAbiertas.set(secciones);
        this.cdr.detectChanges();
      }
    });
  }

  abrirModal() {
    this.modalAbierto.set(true);
  }

  cerrarModal() {
    this.modalAbierto.set(false);
  }

  onEstadoCambiado() {
    this.cerrarModal();
    this.cargarFicha();
    this.estadoActualizado.emit();
  }

  seleccionarFoto(url: string) {
    this.fotoActiva.set(url);
  }

  toggleSeccion(seccion: string) {
    const actuales = new Set(this.seccionesAbiertas());
    if (actuales.has(seccion)) {
      actuales.delete(seccion);
    } else {
      actuales.add(seccion);
    }
    this.seccionesAbiertas.set(actuales);
  }

  esSeccionAbierta(seccion: string): boolean {
    return this.seccionesAbiertas().has(seccion);
  }

  getEtiquetaHabito(habit: string): string {
    const map: Record<string, string> = {
      arbol: 'Árbol',
      palmera: 'Palmera',
      arbusto: 'Arbusto',
      liana: 'Liana',
      hierba: 'Hierba',
    };
    return map[habit] ?? habit;
  }

  getEtiquetaFoto(tipo: string): string {
    const map: Record<string, string> = {
      hoja:            'Hoja',
      flor:            'Flor',
      fruto:           'Fruto',
      planta_completa: 'Planta completa',
      semilla:         'Semilla',
    };
    return map[tipo] ?? tipo;
  }

  /**
   * Convierte un field_name técnico (ej. "forma_hoja") en una etiqueta
   * legible (ej. "Forma hoja"). Se usa cuando no hay mejor fuente de nombre.
   */
  private humanizarCampo(campo: string): string {
    const limpio = campo.replace(/_/g, ' ').trim();
    return limpio.charAt(0).toUpperCase() + limpio.slice(1);
  }

  /**
   * Agrupa el morphological_data (JSON plano) por sección usando la estructura
   * del catálogo. Cada field_name se ubica en su sección según la estructura;
   * los campos que no aparezcan en la estructura van a "Otros".
   * Si no hay estructura disponible, todo va a una sola sección general.
   */
  getMorfologiaEntradas(): SeccionMorfologica[] {
    const data = this.ficha()?.morphological_data;
    if (!data || Object.keys(data).length === 0) return [];

    const estructura = this.estructura();

    // Fallback: sin estructura, todo en una sección general (sin agrupar)
    if (!estructura.length) {
      return [{
        seccion: 'Características morfológicas',
        campos: Object.entries(data).map(([campo, valor]) => ({
          campo,
          etiqueta: this.humanizarCampo(campo),
          valor,
        })),
      }];
    }

    // Mapa field_name → { section, display_order } a partir de la estructura.
    // La estructura tiene una fila por opción; nos quedamos con la primera
    // aparición de cada field_name (comparación normalizada, sin tildes ni mayúsculas).
    const mapaCampo = new Map<string, { section: string; orden: number }>();
    for (const v of estructura) {
      const clave = this.normalizar(v.field_name);
      if (!mapaCampo.has(clave)) {
        mapaCampo.set(clave, {
          section: v.section?.trim() || 'Otros',
          orden: v.display_order ?? 0,
        });
      }
    }

    // Orden de secciones según el menor display_order encontrado en cada una
    const ordenSeccion = new Map<string, number>();
    for (const info of mapaCampo.values()) {
      const actual = ordenSeccion.get(info.section);
      if (actual === undefined || info.orden < actual) {
        ordenSeccion.set(info.section, info.orden);
      }
    }

    // Agrupamos los campos del registro
    const agrupado = new Map<string, CampoMorfologico[]>();
    for (const [campo, valor] of Object.entries(data)) {
      const info = mapaCampo.get(this.normalizar(campo));
      const seccion = info?.section ?? 'Otros';
      if (!agrupado.has(seccion)) agrupado.set(seccion, []);
      agrupado.get(seccion)!.push({
        campo,
        etiqueta: this.humanizarCampo(campo),
        valor,
      });
    }

    // Convertimos a array y ordenamos por el orden de la sección
    return Array.from(agrupado.entries())
      .map(([seccion, campos]) => ({ seccion, campos }))
      .sort((a, b) => {
        const oa = ordenSeccion.get(a.seccion) ?? 999;
        const ob = ordenSeccion.get(b.seccion) ?? 999;
        if (oa !== ob) return oa - ob;
        return a.seccion.localeCompare(b.seccion);
      });
  }

  private normalizar(texto: string): string {
    if (!texto) return '';
    return texto
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  formatearValor(valor: any): string {
    if (Array.isArray(valor)) return valor.join(', ');
    if (valor === null || valor === undefined || valor === '') return '—';
    return String(valor);
  }
}