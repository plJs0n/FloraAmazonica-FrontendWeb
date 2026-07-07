import { Component, OnInit, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ConsultaService } from '../../servicios/consulta.service';
import {
  FiltroMorfologico,
  EspecieRegistro,
  ResultadoBusqueda,
} from '../../modelos/consulta.models';

type Paso = 'habito' | 'filtros' | 'resultados';

const HABITOS = [
  { valor: 'arbol',   etiqueta: 'Árbol' },
  { valor: 'palmera', etiqueta: 'Palmera' },
  { valor: 'arbusto', etiqueta: 'Arbusto' },
  { valor: 'liana',   etiqueta: 'Liana' },
  { valor: 'hierba',  etiqueta: 'Hierba' },
  { valor: '',        etiqueta: 'No estoy seguro' },
];

@Component({
  selector: 'app-buscador-morfologico',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './buscador-morfologico.html',
  styleUrl: './buscador-morfologico.css',
})
export class BuscadorMorfologico implements OnInit {
  readonly habitos = HABITOS;

  // ── Paso actual ──────────────────────────────────────────────────────────
  paso = signal<Paso>('habito');

  // ── Buscador por texto ───────────────────────────────────────────────────
  textoBusqueda = signal('');
  sugerencias = signal<string[]>([]);
  mostrarSugerencias = signal(false);
  q = signal('');
  private sugerenciasSubject = new Subject<string>();

  // ── Hábito y filtros ─────────────────────────────────────────────────────
  habitoSeleccionado = signal<string | null>(null);
  cargandoFiltros = signal(false);
  cargandoResultados = signal(false);
  error = signal('');

  filtros = signal<FiltroMorfologico[]>([]);
  seleccionados = signal<Record<string, string>>({});
  seccionesAbiertas = signal<Record<string, boolean>>({});

  // ── Resultados ───────────────────────────────────────────────────────────
  resultados = signal<EspecieRegistro[]>([]);
  totalResultados = signal(0);
  paginaActual = signal(1);
  totalPaginas = signal(1);

  // ── Computed ─────────────────────────────────────────────────────────────
  readonly secciones = computed(() => {
    const mapa = new Map<string, FiltroMorfologico[]>();
    for (const f of this.filtros()) {
      const sec = f.section || 'General';
      if (!mapa.has(sec)) mapa.set(sec, []);
      mapa.get(sec)!.push(f);
    }
    return Array.from(mapa.entries()).map(([nombre, campos]) => ({ nombre, campos }));
  });

  readonly cantidadSeleccionados = computed(() =>
    Object.values(this.seleccionados()).filter(v => !!v).length
  );

  readonly resultadosExactos = computed(() =>
    this.resultados().filter(e => this.scoreEspecie(e) === this.cantidadSeleccionados())
  );

  readonly resultadosSimilares = computed(() =>
    this.resultados().filter(e => this.scoreEspecie(e) < this.cantidadSeleccionados())
  );

  constructor(
    private consulta: ConsultaService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.sugerenciasSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(texto => {
        if (texto.length < 2) {
          this.sugerencias.set([]);
          this.mostrarSugerencias.set(false);
          return [];
        }
        return this.consulta.getSugerencias(texto);
      })
    ).subscribe({
      next: (resultado) => {
        this.sugerencias.set(resultado);
        this.mostrarSugerencias.set(resultado.length > 0);
        this.cdr.detectChanges();
      }
    });
  }

  // ── Autocomplete ─────────────────────────────────────────────────────────

  onInputTexto(event: Event) {
    const valor = (event.target as HTMLInputElement).value;
    this.textoBusqueda.set(valor);
    this.q.set('');
    this.sugerenciasSubject.next(valor);
  }

  elegirSugerencia(sugerencia: string) {
    this.textoBusqueda.set(sugerencia);
    this.q.set(sugerencia);
    this.sugerencias.set([]);
    this.mostrarSugerencias.set(false);
    this.buscarDirecto();
  }

  cerrarSugerencias() {
    setTimeout(() => this.mostrarSugerencias.set(false), 150);
  }

  buscarDirecto() {
    this.q.set(this.textoBusqueda());
    this.habitoSeleccionado.set(null);
    this.seleccionados.set({});
    this.buscar();
  }

  // ── Paso 1: hábito ───────────────────────────────────────────────────────

  elegirHabito(valor: string) {
    this.habitoSeleccionado.set(valor);
    this.seleccionados.set({});
    this.q.set('');
    this.textoBusqueda.set('');
    this.cargandoFiltros.set(true);
    this.error.set('');

    this.consulta.getFiltros(valor || undefined).subscribe({
      next: (data) => {
        this.filtros.set(data);
        if (data.length > 0) {
          const primera = data[0].section || 'General';
          this.seccionesAbiertas.set({ [primera]: true });
        }
        this.cargandoFiltros.set(false);
        this.paso.set('filtros');
        this.cdr.detectChanges();
      },
      error: () => {
        this.error.set('Error al buscar. Intenta de nuevo.');
        this.cargandoFiltros.set(false);
        this.cdr.detectChanges();
      },
    });
  }

  // ── Paso 2: filtros ──────────────────────────────────────────────────────

  toggleSeccion(nombre: string) {
    const actual = this.seccionesAbiertas();
    this.seccionesAbiertas.set({ ...actual, [nombre]: !actual[nombre] });
  }

  estaAbierta(nombre: string): boolean {
    return !!this.seccionesAbiertas()[nombre];
  }

  toggleChip(fieldName: string, opcion: string) {
    const actual = { ...this.seleccionados() };
    actual[fieldName] = actual[fieldName] === opcion ? '' : opcion;
    this.seleccionados.set(actual);
  }

  estaSeleccionado(fieldName: string, opcion: string): boolean {
    return this.seleccionados()[fieldName] === opcion;
  }

  buscar(pagina = 1) {
    this.cargandoResultados.set(true);
    this.error.set('');

    const filtrosSlug: Record<string, string> = {};
    for (const [fieldName, valor] of Object.entries(this.seleccionados())) {
      if (valor) {
        filtrosSlug[this.consulta.toSlug(fieldName)] = valor;
      }
    }

    this.consulta.buscar({
      habit: this.habitoSeleccionado() || undefined,
      q: this.q() || undefined,
      filtros: filtrosSlug,
      page: pagina,
      limit: 20,
    }).subscribe({
      next: (res: ResultadoBusqueda) => {
        this.resultados.set(res.data);
        this.totalResultados.set(res.total);
        this.paginaActual.set(res.page);
        this.totalPaginas.set(res.totalPages);
        this.cargandoResultados.set(false);
        this.paso.set('resultados');
        this.cdr.detectChanges();
      },
      error: () => {
        this.error.set('Error al buscar. Intentá de nuevo.');
        this.cargandoResultados.set(false);
        this.cdr.detectChanges();
      },
    });
  }

  // ── Paso 3: resultados ───────────────────────────────────────────────────

  scoreEspecie(especie: EspecieRegistro): number {
    let score = 0;
    const data = especie.morphological_data ?? {};
    for (const [fieldName, valor] of Object.entries(this.seleccionados())) {
      if (!valor) continue;
      const valorEspecie = data[fieldName];
      if (Array.isArray(valorEspecie)) {
        if (valorEspecie.some((v: string) => v.toLowerCase() === valor.toLowerCase())) score++;
      } else if (typeof valorEspecie === 'string') {
        if (valorEspecie.toLowerCase() === valor.toLowerCase()) score++;
      }
    }
    return score;
  }

  irAFicha(id: string) {
    this.router.navigate(['/ficha-tecnica', id]);
  }

  volverAFiltros() {
    this.paso.set('filtros');
    this.resultados.set([]);
  }

  volverAHabito() {
    this.paso.set('habito');
    this.filtros.set([]);
    this.seleccionados.set({});
    this.resultados.set([]);
    this.habitoSeleccionado.set(null);
  }

  paginaAnterior() {
    if (this.paginaActual() > 1) this.buscar(this.paginaActual() - 1);
  }

  paginaSiguiente() {
    if (this.paginaActual() < this.totalPaginas()) this.buscar(this.paginaActual() + 1);
  }

  primeraFoto(especie: EspecieRegistro): string {
    return especie.photos?.[0]?.cloudinary_url ?? '';
  }
}