import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogoServicio } from '../../servicios/catalogo.servicio';
import { EspecieCatalogo } from '../../modelos/especie-catalogo.modelo';
import { CargaCatalogo } from './carga-catalogo/carga-catalogo';

type FiltroEstado = 'todos' | 'activas' | 'inactivas';

@Component({
  selector: 'app-familias-especies',
  standalone: true,
  imports: [CommonModule, FormsModule, CargaCatalogo],
  templateUrl: './familias-especies.html',
  styleUrl: './familias-especies.css',
})
export class FamiliasEspecies implements OnInit {
  especies = signal<EspecieCatalogo[]>([]);
  cargando = signal(false);
  textoBusqueda = signal('');
  filtroEstado = signal<FiltroEstado>('todos');
  mostrarModalCarga = signal(false);

  // Edición de una especie puntual
  especieEnEdicion = signal<EspecieCatalogo | null>(null);
  nombreCientificoEditado = signal('');
  familiaEditada = signal('');
  activaEditada = signal(true);
  guardandoEdicion = signal(false);
  errorEdicion = signal<string | null>(null);

  readonly especiesFiltradas = computed(() => {
    const filtro = this.filtroEstado();
    const texto = this.textoBusqueda().trim().toLowerCase();

    return this.especies().filter((especie) => {
      const coincideEstado =
        filtro === 'todos' ||
        (filtro === 'activas' && especie.is_active) ||
        (filtro === 'inactivas' && !especie.is_active);

      const coincideTexto =
        !texto ||
        especie.scientific_name.toLowerCase().includes(texto) ||
        especie.family.toLowerCase().includes(texto);

      return coincideEstado && coincideTexto;
    });
  });

  readonly totalFamilias = computed(() => {
    const familias = new Set(this.especies().map((e) => e.family.trim().toLowerCase()));
    return familias.size;
  });

  constructor(private catalogoServicio: CatalogoServicio) {}

  ngOnInit(): void {
    this.cargarEspecies();
  }

  cargarEspecies(): void {
    this.cargando.set(true);
    this.catalogoServicio.listarEspecies().subscribe({
      next: (especies) => {
        this.especies.set(especies);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  abrirModalCarga(): void {
    this.mostrarModalCarga.set(true);
  }

  cerrarModalCarga(): void {
    this.mostrarModalCarga.set(false);
  }

  onImportacionCompletada(): void {
    this.mostrarModalCarga.set(false);
    this.cargarEspecies();
  }

  abrirEdicion(especie: EspecieCatalogo): void {
    this.especieEnEdicion.set(especie);
    this.nombreCientificoEditado.set(especie.scientific_name);
    this.familiaEditada.set(especie.family);
    this.activaEditada.set(especie.is_active);
    this.errorEdicion.set(null);
  }

  cerrarEdicion(): void {
    this.especieEnEdicion.set(null);
  }

  guardarEdicion(): void {
    const especie = this.especieEnEdicion();
    if (!especie) return;

    const nombre = this.nombreCientificoEditado().trim();
    const familia = this.familiaEditada().trim();

    if (!nombre || !familia) {
      this.errorEdicion.set('El nombre científico y la familia son obligatorios.');
      return;
    }

    this.guardandoEdicion.set(true);
    this.errorEdicion.set(null);

    this.catalogoServicio
      .editarEspecie(especie.id, { scientific_name: nombre, family: familia })
      .subscribe({
        next: () => {
          // Si además cambió el estado, se hace una segunda llamada al endpoint dedicado.
          if (this.activaEditada() !== especie.is_active) {
            this.catalogoServicio.cambiarEstadoEspecie(especie.id, this.activaEditada()).subscribe({
              next: () => this.finalizarEdicion(),
              error: () => {
                this.errorEdicion.set('Se guardaron los datos, pero no se pudo actualizar el estado.');
                this.guardandoEdicion.set(false);
              },
            });
          } else {
            this.finalizarEdicion();
          }
        },
        error: () => {
          this.errorEdicion.set('No se pudo guardar. Verifica los datos e intenta de nuevo.');
          this.guardandoEdicion.set(false);
        },
      });
  }

  private finalizarEdicion(): void {
    this.guardandoEdicion.set(false);
    this.especieEnEdicion.set(null);
    this.cargarEspecies();
  }
}