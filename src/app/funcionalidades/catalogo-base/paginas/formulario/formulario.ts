// funcionalidades/catalogo-base/paginas/formulario/formulario.ts

import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';

import { ValoresMorfologicosServicio } from '../../servicios/valores-morfologicos.servicio';
import {
  CampoMorfologico,
  Habito,
  HABITOS,
  ValorMorfologico,
} from '../../modelos/valor-morfologico.modelo';
import { ModalCampo, ResultadoModalCampo } from '../../componentes/modal-campo/modal-campo';
import { BloqueCampo } from '../../componentes/bloque-campo/bloque-campo';
import { BloqueCatalogo, ConfigCatalogo } from '../../componentes/bloque-catalogo/bloque-catalogo';

const CONFIG_CATALOGO_KEY = 'flora_config_catalogo';

const CONFIG_INICIAL: ConfigCatalogo = {
  seccion: 'Identificación',
  etiquetaFamilia: 'Familia botánica',
  etiquetaEspecie: 'Nombre científico',
};

@Component({
  selector: 'app-formulario',
  imports: [ModalCampo, BloqueCampo, BloqueCatalogo],
  templateUrl: './formulario.html',
  styleUrl: './formulario.css',
})
export class Formulario implements OnInit {
  private servicio = inject(ValoresMorfologicosServicio);
  private cdr = inject(ChangeDetectorRef);

  readonly habitos = HABITOS;
  habitoActual: Habito = 'árbol';

  valoresPorHabito: Record<string, ValorMorfologico[]> = {};
  campos: CampoMorfologico[] = [];

  cargando = false;
  mensaje = '';

  // Bloque catálogo fijo
  configCatalogo: ConfigCatalogo = { ...CONFIG_INICIAL };

  // Modal
  modalAbierto = false;
  campoEnEdicion: CampoMorfologico | null = null;
  habitosGemelos: string[] = [];

  // Drag & drop
  private indiceArrastre: number | null = null;

  ngOnInit(): void {
    this.cargarConfigCatalogo();
    this.cargarHabito(this.habitoActual);
    this.refrescar();
  }

  // ---- Config bloque catálogo (localStorage) ----

  private cargarConfigCatalogo(): void {
    try {
      const guardado = localStorage.getItem(CONFIG_CATALOGO_KEY);

      if (guardado) {
        this.configCatalogo = { ...JSON.parse(guardado) };
      }
    } catch {
      this.configCatalogo = { ...CONFIG_INICIAL };
    }

    this.refrescar();
  }

  onGuardarConfigCatalogo(config: ConfigCatalogo): void {
    this.configCatalogo = { ...config };

    try {
      localStorage.setItem(CONFIG_CATALOGO_KEY, JSON.stringify(this.configCatalogo));
    } catch {
      // Sin acceso a localStorage, ignora
    }

    this.mostrarMensaje('Nombres del campo actualizados');
    this.refrescar();
  }

  // ---- Carga de hábito ----

  cambiarHabito(habito: Habito): void {
    this.habitoActual = habito;

    if (this.valoresPorHabito[habito]) {
      this.reagrupar();
    } else {
      this.cargarHabito(habito);
    }

    this.refrescar();
  }

  private cargarHabito(habito: Habito): void {
    this.cargando = true;
    this.refrescar();

    this.servicio.listarPorHabito(habito).subscribe({
      next: (valores) => {
        this.valoresPorHabito[habito] = valores;
        this.reagrupar();
        this.cargando = false;
        this.refrescar();
      },
      error: () => {
        this.mostrarMensaje('No se pudieron cargar los campos');
        this.cargando = false;
        this.refrescar();
      },
    });
  }

  private reagrupar(): void {
    const valores = this.valoresPorHabito[this.habitoActual] ?? [];
    this.campos = [...this.servicio.agruparEnCampos(valores)];
    this.refrescar();
  }

  private recargarActual(): void {
    delete this.valoresPorHabito[this.habitoActual];
    this.cargarHabito(this.habitoActual);
    this.refrescar();
  }

  // ---- Modal ----

  abrirNuevo(): void {
    this.campoEnEdicion = null;
    this.habitosGemelos = [];
    this.modalAbierto = true;
    this.refrescar();
  }

  abrirEdicion(campo: CampoMorfologico): void {
    this.campoEnEdicion = campo;
    this.habitosGemelos = this.servicio.buscarCampoEnHabitos(
      campo.section,
      campo.field_name,
      this.valoresPorHabito,
      this.habitoActual,
    );
    this.modalAbierto = true;
    this.refrescar();
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.campoEnEdicion = null;
    this.habitosGemelos = [];
    this.refrescar();
  }

  onConfirmarModal(resultado: ResultadoModalCampo): void {
    if (this.campoEnEdicion) {
      this.guardarEdicionCampo(resultado);
    } else {
      this.crearCampo(resultado);
    }

    this.refrescar();
  }

  private crearCampo(r: ResultadoModalCampo): void {
    this.cargando = true;
    this.refrescar();

    this.servicio
      .crearEnHabitos(
        r.habitos,
        {
          section: r.section,
          field_name: r.field_name,
          selection_type: r.selection_type,
          is_required: r.is_required,
        },
        r.opciones,
      )
      .subscribe({
        next: () => {
          this.cerrarModal();
          this.limpiarCacheHabitos(r.habitos);
          this.recargarActual();
          this.mostrarMensaje('Campo creado');
          this.refrescar();
        },
        error: (err) => {
          this.cargando = false;
          this.mostrarMensaje(this.textoError(err));
          this.refrescar();
        },
      });
  }

  private guardarEdicionCampo(r: ResultadoModalCampo): void {
    const campo = this.campoEnEdicion!;

    const metadatos = {
      section: r.section,
      field_name: r.field_name,
      selection_type: r.selection_type,
      is_required: r.is_required,
    };

    const ids = campo.opciones.map((o) => o.id);

    if (r.aplicarEnOtros && this.habitosGemelos.length) {
      for (const habitoGemelo of this.habitosGemelos) {
        const valoresGemelo = this.valoresPorHabito[habitoGemelo] ?? [];

        for (const opcion of campo.opciones) {
          const gemela = this.servicio.buscarOpcionGemela(
            campo.section,
            campo.field_name,
            opcion.option_value,
            valoresGemelo,
          );

          if (gemela) {
            ids.push(gemela.id);
          }
        }
      }
    }

    this.cargando = true;
    this.refrescar();

    this.servicio.actualizarMetadatosCampo(ids, metadatos).subscribe({
      next: () => {
        this.cerrarModal();
        this.limpiarCacheHabitos([this.habitoActual, ...this.habitosGemelos]);
        this.recargarActual();
        this.mostrarMensaje('Campo actualizado');
        this.refrescar();
      },
      error: (err) => {
        this.cargando = false;
        this.mostrarMensaje(this.textoError(err));
        this.refrescar();
      },
    });
  }

  // ---- Acciones sobre campos y opciones ----

  alternarCampo(campo: CampoMorfologico): void {
    const nuevoEstado = !campo.activo;
    const ids = campo.opciones.map((o) => o.id);

    this.cargando = true;
    this.refrescar();

    let pendientes = ids.length;

    for (const id of ids) {
      this.servicio.cambiarEstado(id, nuevoEstado).subscribe({
        next: () => {
          if (--pendientes === 0) {
            this.recargarActual();
            this.mostrarMensaje(
              nuevoEstado
                ? 'Campo activado'
                : 'Campo desactivado. Los registros existentes no se ven afectados',
            );
            this.refrescar();
          }
        },
        error: () => {
          this.cargando = false;
          this.mostrarMensaje('No se pudo cambiar el estado del campo');
          this.refrescar();
        },
      });
    }
  }

  alternarOpcion(opcion: ValorMorfologico): void {
    const nuevoEstado = !opcion.is_active;

    this.cargando = true;
    this.refrescar();

    this.servicio.cambiarEstado(opcion.id, nuevoEstado).subscribe({
      next: () => {
        this.recargarActual();
        this.mostrarMensaje(nuevoEstado ? 'Opción activada' : 'Opción desactivada');
        this.refrescar();
      },
      error: () => {
        this.cargando = false;
        this.mostrarMensaje('No se pudo cambiar el estado de la opción');
        this.refrescar();
      },
    });
  }

  agregarOpcion(campo: CampoMorfologico): void {
    const valor = prompt('Nombre de la nueva opción:');

    if (!valor || !valor.trim()) {
      return;
    }

    const valorLimpio = valor.trim();
    const valoresHabito = this.valoresPorHabito[this.habitoActual] ?? [];

    if (
      this.servicio.existeDuplicado(
        valoresHabito,
        campo.section,
        campo.field_name,
        valorLimpio,
      )
    ) {
      this.mostrarMensaje('Esa opción ya existe en este campo');
      this.refrescar();
      return;
    }

    const nuevoOrden = campo.opciones.length
      ? Math.max(...campo.opciones.map((o) => o.display_order)) + 1
      : 0;

    this.cargando = true;
    this.refrescar();

    this.servicio
      .crear({
        habit: this.habitoActual,
        section: campo.section,
        field_name: campo.field_name,
        option_value: valorLimpio,
        selection_type: campo.selection_type,
        is_required: campo.is_required,
        display_order: nuevoOrden,
      })
      .subscribe({
        next: () => {
          this.recargarActual();
          this.mostrarMensaje('Opción agregada');
          this.refrescar();
        },
        error: (err) => {
          this.cargando = false;
          this.mostrarMensaje(this.textoError(err));
          this.refrescar();
        },
      });
  }

  editarOpcion(opcion: ValorMorfologico): void {
    const valor = prompt('Editar opción:', opcion.option_value);

    if (!valor || !valor.trim() || valor.trim() === opcion.option_value) {
      return;
    }

    const valorLimpio = valor.trim();
    const valoresHabito = this.valoresPorHabito[this.habitoActual] ?? [];

    if (
      this.servicio.existeDuplicado(
        valoresHabito,
        opcion.section,
        opcion.field_name,
        valorLimpio,
        opcion.id,
      )
    ) {
      this.mostrarMensaje('Esa opción ya existe en este campo');
      this.refrescar();
      return;
    }

    this.cargando = true;
    this.refrescar();

    this.servicio.actualizar(opcion.id, { option_value: valorLimpio }).subscribe({
      next: () => {
        this.recargarActual();
        this.mostrarMensaje('Opción actualizada');
        this.refrescar();
      },
      error: (err) => {
        this.cargando = false;
        this.mostrarMensaje(this.textoError(err));
        this.refrescar();
      },
    });
  }

  // ---- Drag & drop ----

  onArrastrarInicio(indice: number): void {
    this.indiceArrastre = indice;
    this.refrescar();
  }

  onArrastrarSobre(evento: DragEvent): void {
    evento.preventDefault();
  }

  onSoltar(indiceDestino: number): void {
    if (this.indiceArrastre === null || this.indiceArrastre === indiceDestino) {
      this.indiceArrastre = null;
      this.refrescar();
      return;
    }

    const [movido] = this.campos.splice(this.indiceArrastre, 1);
    this.campos.splice(indiceDestino, 0, movido);

    this.campos = [...this.campos];
    this.indiceArrastre = null;

    this.persistirOrden();
    this.refrescar();
  }

  private persistirOrden(): void {
    this.cargando = true;
    this.refrescar();

    this.servicio.guardarOrden(this.campos).subscribe({
      next: () => {
        this.recargarActual();
        this.mostrarMensaje('Orden actualizado');
        this.refrescar();
      },
      error: () => {
        this.cargando = false;
        this.mostrarMensaje('No se pudo guardar el nuevo orden');
        this.refrescar();
      },
    });
  }

  // ---- Helpers ----

  private limpiarCacheHabitos(habitos: string[]): void {
    for (const h of habitos) {
      delete this.valoresPorHabito[h];
    }

    this.refrescar();
  }

  private textoError(err: unknown): string {
    const e = err as { status?: number; error?: { message?: string } };

    if (e?.status === 409) {
      return 'Ese valor ya existe en el mismo contexto';
    }

    return e?.error?.message ?? 'Ocurrió un error al guardar';
  }

  private mostrarMensaje(texto: string): void {
    this.mensaje = texto;
    this.refrescar();

    setTimeout(() => {
      this.mensaje = '';
      this.refrescar();
    }, 3000);
  }

  private refrescar(): void {
    this.cdr.detectChanges();
  }
}