import { Component, OnInit, signal, computed, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { ValidacionService } from '../../servicios/validacion.service';
import { RegistroPendiente, EstadoRegistro } from '../../modelos/validacion.models';
import { DetalleValidacion } from '../detalle-validacion/detalle-validacion';

@Component({
  selector: 'app-lista-registros-pendientes',
  standalone: true,
  imports: [CommonModule, DetalleValidacion],
  templateUrl: './lista-registros-pendientes.html',
  styleUrl: './lista-registros-pendientes.css'
})
export class ListaRegistrosPendientes implements OnInit {
  registros = signal<RegistroPendiente[]>([]);
  registroSeleccionado = signal<string | null>(null);
  filtroEstado = signal<EstadoRegistro | undefined>(undefined);
  cargando = signal(false);
  error = signal<string | null>(null);

  totalRegistros = signal(0);
  paginaActual = signal(1);
  totalPaginas = signal(1);

  private readonly destroyRef = inject(DestroyRef);
  private readonly INTERVALO_POLLING_MS = 20000;

  private readonly prioridadEstado: Record<EstadoRegistro, number> = {
    en_revision: 0,
    observado: 1,
    validado: 2,
    rechazado: 3,
  };

  readonly estados: { valor: EstadoRegistro; etiqueta: string }[] = [
    { valor: 'en_revision', etiqueta: 'En revisión' },
    { valor: 'observado', etiqueta: 'Observado' },
    { valor: 'validado', etiqueta: 'Validado' },
    { valor: 'rechazado', etiqueta: 'Rechazado' },
  ];

  /**
   * Texto del badge según el filtro activo.
   * "Todos" → total de registros
   * Cualquier estado → total de ese estado con su etiqueta
   */
  badgeTexto = computed(() => {
    const total = this.totalRegistros();
    const filtro = this.filtroEstado();
    if (!filtro) {
      return `${total} registro${total === 1 ? '' : 's'}`;
    }
    const etiquetas: Record<EstadoRegistro, string> = {
      en_revision: `${total} en revisión`,
      observado: `${total} observado${total === 1 ? '' : 's'}`,
      validado: `${total} validado${total === 1 ? '' : 's'}`,
      rechazado: `${total} rechazado${total === 1 ? '' : 's'}`,
    };
    return etiquetas[filtro];
  });

  badgeClase = computed(() => {
    const filtro = this.filtroEstado();
    if (!filtro) return 'badge-todos';
    const clases: Record<EstadoRegistro, string> = {
      en_revision: 'badge-revision',
      observado: 'badge-observado',
      validado: 'badge-validado',
      rechazado: 'badge-rechazado',
    };
    return clases[filtro];
  });

  constructor(
    private validacionService: ValidacionService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.cargarRegistros();
    this.iniciarPolling();
  }

  private iniciarPolling() {
    interval(this.INTERVALO_POLLING_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cargarRegistros(true));
  }

  cargarRegistros(silencioso = false) {
    if (!silencioso) {
      this.cargando.set(true);
    }
    this.error.set(null);
    this.validacionService.getPendientes(this.paginaActual(), 20, this.filtroEstado()).subscribe({
      next: (res) => {
        this.registros.set(this.ordenarRegistros(res.data));
        this.totalRegistros.set(res.total);
        this.totalPaginas.set(res.totalPages);
        this.cargando.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        if (!silencioso) {
          this.error.set('No se pudo cargar la lista de registros.');
        }
        this.cargando.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  private ordenarRegistros(lista: RegistroPendiente[]): RegistroPendiente[] {
    return [...lista].sort((a, b) => {
      const pa = this.prioridadEstado[a.status] ?? 99;
      const pb = this.prioridadEstado[b.status] ?? 99;
      if (pa !== pb) return pa - pb;
      return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
    });
  }

  seleccionar(id: string) {
    this.registroSeleccionado.set(id);
  }

  volverALista() {
    this.registroSeleccionado.set(null);
  }

  aplicarFiltro(estado: EstadoRegistro | undefined) {
    this.filtroEstado.set(estado);
    this.paginaActual.set(1);
    this.registroSeleccionado.set(null);
    this.cargarRegistros();
  }

  onEstadoActualizado() {
    this.cargarRegistros();
  }

  getClaseEstado(status: EstadoRegistro): string {
    const clases: Record<EstadoRegistro, string> = {
      en_revision: 'estado-revision',
      observado: 'estado-observado',
      validado: 'estado-validado',
      rechazado: 'estado-rechazado',
    };
    return clases[status];
  }

  getEtiquetaEstado(status: EstadoRegistro): string {
    const etiquetas: Record<EstadoRegistro, string> = {
      en_revision: 'En revisión',
      observado: 'Observado',
      validado: 'Validado',
      rechazado: 'Rechazado',
    };
    return etiquetas[status];
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
}