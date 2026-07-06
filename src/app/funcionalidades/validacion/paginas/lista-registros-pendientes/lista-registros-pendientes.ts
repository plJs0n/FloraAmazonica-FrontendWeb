import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  readonly estados: { valor: EstadoRegistro; etiqueta: string }[] = [
    { valor: 'en_revision', etiqueta: 'En revisión' },
    { valor: 'observado', etiqueta: 'Observado' },
    { valor: 'validado', etiqueta: 'Validado' },
    { valor: 'rechazado', etiqueta: 'Rechazado' },
  ];

  constructor(private validacionService: ValidacionService) {}

  ngOnInit() {
    this.cargarRegistros();
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
}