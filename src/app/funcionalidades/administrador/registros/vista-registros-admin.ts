import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ValidacionService } from '../../validacion/servicios/validacion.service';
import { RegistroPendiente, EstadoRegistro } from '../../validacion/modelos/validacion.models';
import { DetalleValidacion } from '../../validacion/paginas/detalle-validacion/detalle-validacion';

interface ConteoEstados {
  validado: number;
  en_revision: number;
  observado: number;
  rechazado: number;
}

@Component({
  selector: 'app-vista-registros-admin',
  standalone: true,
  imports: [CommonModule, DetalleValidacion],
  templateUrl: './vista-registros-admin.html',
  styleUrl: './vista-registros-admin.css'
})
export class VistaRegistrosAdmin implements OnInit {
  registros = signal<RegistroPendiente[]>([]);
  registroSeleccionado = signal<string | null>(null);
  filtroEstado = signal<EstadoRegistro | undefined>(undefined);
  cargando = signal(false);
  cargandoConteos = signal(false);
  error = signal<string | null>(null);

  totalRegistros = signal(0);
  paginaActual = signal(1);
  totalPaginas = signal(1);

  conteos = signal<ConteoEstados>({
    validado: 0,
    en_revision: 0,
    observado: 0,
    rechazado: 0,
  });

  readonly estados: { valor: EstadoRegistro; etiqueta: string }[] = [
    { valor: 'en_revision', etiqueta: 'En revisión' },
    { valor: 'observado', etiqueta: 'Observado' },
    { valor: 'validado', etiqueta: 'Validado' },
    { valor: 'rechazado', etiqueta: 'Rechazado' },
  ];

  readonly tarjetasEstado = [
    { valor: 'validado' as EstadoRegistro, etiqueta: 'Validados', clase: 'card-validado' },
    { valor: 'en_revision' as EstadoRegistro, etiqueta: 'En revisión', clase: 'card-revision' },
    { valor: 'observado' as EstadoRegistro, etiqueta: 'En observación', clase: 'card-observado' },
    { valor: 'rechazado' as EstadoRegistro, etiqueta: 'Rechazados', clase: 'card-rechazado' },
  ];

  constructor(private validacionService: ValidacionService) {}

  ngOnInit() {
    this.cargarConteos();
    this.cargarRegistros();
  }

  cargarConteos() {
    this.cargandoConteos.set(true);
    const estados: EstadoRegistro[] = ['validado', 'en_revision', 'observado', 'rechazado'];
    let completados = 0;
    const nuevosConteos: ConteoEstados = { validado: 0, en_revision: 0, observado: 0, rechazado: 0 };

    estados.forEach(estado => {
      this.validacionService.getPendientes(1, 1, estado).subscribe({
        next: (res) => {
          nuevosConteos[estado] = res.total;
          completados++;
          if (completados === estados.length) {
            this.conteos.set({ ...nuevosConteos });
            this.cargandoConteos.set(false);
          }
        },
        error: () => {
          completados++;
          if (completados === estados.length) {
            this.cargandoConteos.set(false);
          }
        }
      });
    });
  }

  cargarRegistros() {
    this.cargando.set(true);
    this.error.set(null);
    this.validacionService.getPendientes(this.paginaActual(), 20, this.filtroEstado()).subscribe({
      next: (res) => {
        this.registros.set(res.data);
        this.totalRegistros.set(res.total);
        this.totalPaginas.set(res.totalPages);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la lista de registros.');
        this.cargando.set(false);
      }
    });
  }

  seleccionar(id: string) {
    this.registroSeleccionado.set(id);
  }

  aplicarFiltro(estado: EstadoRegistro | undefined) {
    this.filtroEstado.set(estado);
    this.paginaActual.set(1);
    this.registroSeleccionado.set(null);
    this.cargarRegistros();
  }

  filtrarPorTarjeta(estado: EstadoRegistro) {
    if (this.filtroEstado() === estado) {
      this.aplicarFiltro(undefined);
    } else {
      this.aplicarFiltro(estado);
    }
  }

  getConteo(estado: EstadoRegistro): number {
    return this.conteos()[estado];
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
}