// funcionalidades/catalogo-base/paginas/formulario/formulario.ts

import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import {
  DragDropModule,
  CdkDragDrop,
  CdkDrag,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { ValoresMorfologicosServicio } from '../../servicios/valores-morfologicos.servicio';
import { SeccionesServicio } from '../../servicios/secciones.servicio';
import {
  CampoMorfologico,
  Habito,
  HABITOS,
  ValorMorfologico,
} from '../../modelos/valor-morfologico.modelo';
import { Seccion } from '../../modelos/seccion.modelo';
import { ModalCampo, ResultadoModalCampo } from '../../componentes/modal-campo/modal-campo';
import { BloqueCampo } from '../../componentes/bloque-campo/bloque-campo';
import { ModalSeccion } from '../../componentes/modal-seccion/modal-seccion';
import { ModalOpcion, ResultadoModalOpcion } from '../../componentes/modal-opcion/modal-opcion';

export type ItemFormulario =
  | { tipo: 'seccion'; seccion: Seccion; campos: CampoMorfologico[] }
  | { tipo: 'campo'; campo: CampoMorfologico };

@Component({
  selector: 'app-formulario',
  imports: [ModalCampo, BloqueCampo, FormsModule, ModalSeccion, DragDropModule, ModalOpcion],
  templateUrl: './formulario.html',
  styleUrl: './formulario.css',
})
export class Formulario implements OnInit {
  private servicio = inject(ValoresMorfologicosServicio);
  private seccionesServicio = inject(SeccionesServicio);
  private cdr = inject(ChangeDetectorRef);

  readonly habitos = HABITOS;
  habitoActual: Habito = 'árbol';

  valoresPorHabito: Record<string, ValorMorfologico[]> = {};
  seccionesPorHabito: Record<string, Seccion[]> = {};

  campos: CampoMorfologico[] = [];
  secciones: Seccion[] = [];
  items: ItemFormulario[] = [];

  cargando = false;
  mensaje = '';
  hayCambios = false;

  // Modal campo
  modalAbierto = false;
  campoEnEdicion: CampoMorfologico | null = null;
  habitosGemelos: string[] = [];
  seccionContexto: string = '';

  // Modal sección
  modalSeccionAbierto = false;
  seccionEnEdicion: Seccion | null = null;

  // Modal opción
  modalOpcionAbierto = false;
  opcionEnEdicion: { campo: CampoMorfologico; opcion?: ValorMorfologico } | null = null;

  ngOnInit(): void {
    this.cargarTodo(this.habitoActual);
    this.cargarSeccionesRestantes();
  }

  // ---- IDs de listas conectadas ----

  get idsListasSecciones(): string[] {
    return this.secciones.map((s) => 'lista-' + s.id);
  }

  get idsTodasLasListas(): string[] {
    return ['lista-principal', ...this.idsListasSecciones];
  }

  /** Las secciones no pueden entrar dentro de otra sección */
  soloCampos = (drag: CdkDrag): boolean => {
    const data = drag.data as ItemFormulario | CampoMorfologico;
    return !('tipo' in data && data.tipo === 'seccion');
  };

  // ---- Carga ----

  cambiarHabito(habito: Habito): void {
    if (this.hayCambios && !confirm('Hay cambios sin guardar. ¿Descartar?')) {
      return;
    }
    this.hayCambios = false;
    this.habitoActual = habito;
    this.cargarTodo(habito);
    this.refrescar();
  }

  private cargarTodo(habito: Habito): void {
    this.cargando = true;
    this.refrescar();

    let camposCargados = false;
    let seccionesCargadas = false;

    const intentarConstruir = () => {
      if (camposCargados && seccionesCargadas) {
        this.construirItems();
        this.cargando = false;
        this.refrescar();
      }
    };

    this.servicio.listarPorHabito(habito).subscribe({
      next: (valores) => {
        this.valoresPorHabito[habito] = valores;
        this.campos = [...this.servicio.agruparEnCampos(valores)];
        camposCargados = true;
        intentarConstruir();
      },
      error: () => {
        this.mostrarMensaje('No se pudieron cargar los campos');
        this.cargando = false;
        this.refrescar();
      },
    });

    this.seccionesServicio.listarPorHabito(habito).subscribe({
      next: (secciones) => {
        this.secciones = secciones;
        this.seccionesPorHabito[habito] = secciones;
        seccionesCargadas = true;
        intentarConstruir();
      },
      error: () => {
        this.secciones = [];
        this.seccionesPorHabito[habito] = [];
        seccionesCargadas = true;
        intentarConstruir();
      },
    });
  }

  private cargarSeccionesRestantes(): void {
    for (const habito of this.habitos) {
      if (habito === this.habitoActual) continue;
      this.seccionesServicio.listarPorHabito(habito).subscribe({
        next: (secciones) => {
          this.seccionesPorHabito[habito] = secciones;
          this.refrescar();
        },
        error: () => {
          this.seccionesPorHabito[habito] = [];
          this.refrescar();
        },
      });
    }
  }

  private recargarActual(): void {
    this.hayCambios = false;
    delete this.valoresPorHabito[this.habitoActual];
    delete this.seccionesPorHabito[this.habitoActual];
    this.cargarTodo(this.habitoActual);
    this.cargarSeccionesRestantes();
  }

  /** Construye la lista mixta ordenada por display_order global */
  private construirItems(): void {
    const nombres = new Set(this.secciones.map((s) => s.name.trim().toLowerCase()));

    const sueltos = this.campos.filter(
      (c) => !c.section || !nombres.has(c.section.trim().toLowerCase()),
    );

    const entradas: { orden: number; item: ItemFormulario }[] = [];

    for (const s of this.secciones) {
      const camposDeSeccion = this.campos
        .filter((c) => c.section?.trim().toLowerCase() === s.name.trim().toLowerCase())
        .sort((a, b) => a.display_order - b.display_order);
      entradas.push({
        orden: s.display_order,
        item: { tipo: 'seccion', seccion: s, campos: camposDeSeccion },
      });
    }

    for (const c of sueltos) {
      entradas.push({ orden: c.display_order, item: { tipo: 'campo', campo: c } });
    }

    entradas.sort((a, b) => a.orden - b.orden);
    this.items = entradas.map((e) => e.item);
    this.refrescar();
  }

  // ---- Drag & drop ----

  onSoltarEnPrincipal(evento: CdkDragDrop<ItemFormulario[]>): void {
    if (evento.previousContainer === evento.container) {
      // Reordenar la lista principal (secciones y campos sueltos)
      moveItemInArray(this.items, evento.previousIndex, evento.currentIndex);
    } else {
      // Un campo sale de una sección hacia la lista principal
      const campo = evento.item.data as CampoMorfologico;
      evento.previousContainer.data.splice(evento.previousIndex, 1);
      this.items.splice(evento.currentIndex, 0, { tipo: 'campo', campo });
      campo.section = '';
    }
    this.items = [...this.items];
    this.hayCambios = true;
    this.refrescar();
  }

  onSoltarEnSeccion(evento: CdkDragDrop<CampoMorfologico[]>, seccion: Seccion): void {
    if (evento.previousContainer === evento.container) {
      // Reordenar dentro de la misma sección
      moveItemInArray(evento.container.data, evento.previousIndex, evento.currentIndex);
    } else if (evento.previousContainer.id === 'lista-principal') {
      // Un campo suelto entra a la sección
      const item = evento.item.data as ItemFormulario;
      if (item.tipo !== 'campo') return;
      const indice = this.items.indexOf(item);
      if (indice !== -1) this.items.splice(indice, 1);
      evento.container.data.splice(evento.currentIndex, 0, item.campo);
      item.campo.section = seccion.name;
      this.items = [...this.items];
    } else {
      // De otra sección a esta
      transferArrayItem(
        evento.previousContainer.data,
        evento.container.data,
        evento.previousIndex,
        evento.currentIndex,
      );
      evento.container.data[evento.currentIndex].section = seccion.name;
    }
    this.hayCambios = true;
    this.refrescar();
  }

  // ---- Guardar cambios ----

  guardarCambios(): void {
    this.cargando = true;
    this.refrescar();

    const peticiones: Observable<unknown>[] = [];

    this.items.forEach((item, i) => {
      if (item.tipo === 'seccion') {
        peticiones.push(
          this.seccionesServicio.actualizar(item.seccion.id, { display_order: i }),
        );
        item.campos.forEach((campo, j) => {
          campo.opciones.forEach((opcion, k) => {
            peticiones.push(
              this.servicio.actualizar(opcion.id, {
                section: item.seccion.name,
                display_order: j * 100 + k,
              }),
            );
          });
        });
      } else {
        item.campo.opciones.forEach((opcion, k) => {
          peticiones.push(
            this.servicio.actualizar(opcion.id, {
              section: '',
              display_order: i * 100 + k,
            }),
          );
        });
      }
    });

    if (!peticiones.length) {
      this.cargando = false;
      this.hayCambios = false;
      this.refrescar();
      return;
    }

    forkJoin(peticiones).subscribe({
      next: () => {
        this.recargarActual();
        this.mostrarMensaje('Cambios guardados');
      },
      error: (err) => {
        this.cargando = false;
        this.mostrarMensaje(this.textoError(err));
        this.refrescar();
      },
    });
  }

  // ---- Secciones ----

  crearSeccion(): void {
    this.seccionEnEdicion = null;
    this.modalSeccionAbierto = true;
    this.refrescar();
  }

  iniciarEdicionSeccion(seccion: Seccion): void {
    this.seccionEnEdicion = seccion;
    this.modalSeccionAbierto = true;
    this.refrescar();
  }

  cerrarModalSeccion(): void {
    this.modalSeccionAbierto = false;
    this.seccionEnEdicion = null;
    this.refrescar();
  }

  onConfirmarModalSeccion(resultado: { name: string }): void {
    this.cargando = true;
    this.refrescar();

    if (this.seccionEnEdicion) {
      this.seccionesServicio.actualizar(this.seccionEnEdicion.id, {
        name: resultado.name,
      }).subscribe({
        next: () => {
          this.cerrarModalSeccion();
          this.recargarActual();
          this.mostrarMensaje('Sección actualizada');
        },
        error: (err) => {
          this.cargando = false;
          this.mostrarMensaje(this.textoError(err));
          this.refrescar();
        },
      });
    } else {
      this.seccionesServicio.crear({
        habit: this.habitoActual,
        name: resultado.name,
        display_order: this.items.length,
      }).subscribe({
        next: () => {
          this.cerrarModalSeccion();
          this.recargarActual();
          this.mostrarMensaje('Sección creada');
        },
        error: (err) => {
          this.cargando = false;
          this.mostrarMensaje(this.textoError(err));
          this.refrescar();
        },
      });
    }
  }

  eliminarSeccion(seccion: Seccion): void {
    const item = this.items.find(
      (it) => it.tipo === 'seccion' && it.seccion.id === seccion.id,
    );
    const tieneCampos = item?.tipo === 'seccion' ? item.campos.length : 0;

    if (tieneCampos > 0) {
      this.mostrarMensaje('Mueve o desactiva los campos antes de borrar la sección');
      return;
    }

    this.cargando = true;
    this.refrescar();

    this.seccionesServicio.eliminar(seccion.id).subscribe({
      next: () => {
        this.recargarActual();
        this.mostrarMensaje('Sección eliminada');
      },
      error: (err) => {
        this.cargando = false;
        this.mostrarMensaje(this.textoError(err));
        this.refrescar();
      },
    });
  }

  // ---- Modal campo ----

  abrirNuevo(seccion: string = ''): void {
    this.campoEnEdicion = null;
    this.habitosGemelos = [];
    this.seccionContexto = seccion;
    this.modalAbierto = true;
    this.cargarSeccionesRestantes();
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
    this.cargarSeccionesRestantes();
    this.refrescar();
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.campoEnEdicion = null;
    this.habitosGemelos = [];
    this.seccionContexto = '';
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

    const opciones = r.field_type === 'number' ? [r.unidad] : r.opciones;
    const habitosDondeCrearSeccion = r.crearSeccionEnHabitos ?? [];

    if (habitosDondeCrearSeccion.length > 0) {
      const peticiones = habitosDondeCrearSeccion.map((h) =>
        this.seccionesServicio.crear({
          habit: h as Habito,
          name: r.section,
          display_order: (this.seccionesPorHabito[h] ?? []).length,
        }),
      );

      forkJoin(peticiones).subscribe({
        next: () => this.ejecutarCrearCampo(r, opciones, habitosDondeCrearSeccion),
        error: (err) => {
          this.cargando = false;
          this.mostrarMensaje(this.textoError(err));
          this.refrescar();
        },
      });
    } else {
      this.ejecutarCrearCampo(r, opciones, []);
    }
  }

  private ejecutarCrearCampo(
    r: ResultadoModalCampo,
    opciones: string[],
    habitosConSeccionNueva: string[],
  ): void {
    this.servicio.crearEnHabitos(
      r.habitos,
      {
        section: r.section,
        field_name: r.field_name,
        selection_type: r.selection_type,
        field_type: r.field_type,
        is_required: r.is_required,
      },
      opciones,
    ).subscribe({
      next: () => {
        this.cerrarModal();
        this.limpiarCacheHabitos([...r.habitos, ...habitosConSeccionNueva]);
        this.recargarActual();
        this.mostrarMensaje('Campo creado');
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
      field_type: r.field_type,
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
          if (gemela) ids.push(gemela.id);
        }
      }
    }

    this.cargando = true;
    this.refrescar();

    this.servicio.actualizarMetadatosCampo(ids, metadatos).subscribe({
      next: () => {
        if (r.agregarOtro) {
          const nuevoOrden = campo.opciones.length
            ? Math.max(...campo.opciones.map((o) => o.display_order)) + 1
            : 0;

          this.servicio.crear({
            habit: this.habitoActual,
            section: campo.section,
            field_name: campo.field_name,
            option_value: 'Otro',
            selection_type: campo.selection_type,
            field_type: campo.field_type,
            is_required: campo.is_required,
            display_order: nuevoOrden,
          }).subscribe({
            next: () => {
              this.cerrarModal();
              this.limpiarCacheHabitos([this.habitoActual, ...this.habitosGemelos]);
              this.recargarActual();
              this.mostrarMensaje('Campo actualizado');
            },
            error: (err) => {
              this.cargando = false;
              this.mostrarMensaje(this.textoError(err));
              this.refrescar();
            },
          });
        } else {
          this.cerrarModal();
          this.limpiarCacheHabitos([this.habitoActual, ...this.habitosGemelos]);
          this.recargarActual();
          this.mostrarMensaje('Campo actualizado');
        }
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
      },
      error: () => {
        this.cargando = false;
        this.mostrarMensaje('No se pudo cambiar el estado de la opción');
        this.refrescar();
      },
    });
  }

  agregarOpcion(campo: CampoMorfologico): void {
    this.opcionEnEdicion = { campo };
    this.modalOpcionAbierto = true;
    this.refrescar();
  }

  editarOpcion(opcion: ValorMorfologico): void {
    const campo = this.campos.find((c) => c.clave === this.servicio.claveCampo(opcion.section, opcion.field_name));
    if (!campo) return;
    this.opcionEnEdicion = { campo, opcion };
    this.modalOpcionAbierto = true;
    this.refrescar();
  }

  cerrarModalOpcion(): void {
    this.modalOpcionAbierto = false;
    this.opcionEnEdicion = null;
    this.refrescar();
  }

  onConfirmarModalOpcion(resultado: ResultadoModalOpcion): void {
    if (!this.opcionEnEdicion) return;
    const { campo, opcion } = this.opcionEnEdicion;

    if (opcion) {
      // Editar
      if (resultado.valor === opcion.option_value) {
        this.cerrarModalOpcion();
        return;
      }

      const valoresHabito = this.valoresPorHabito[this.habitoActual] ?? [];
      if (this.servicio.existeDuplicado(valoresHabito, opcion.section, opcion.field_name, resultado.valor, opcion.id)) {
        this.mostrarMensaje('Esa opción ya existe en este campo');
        this.cerrarModalOpcion();
        return;
      }

      this.cargando = true;
      this.cerrarModalOpcion();
      this.refrescar();

      this.servicio.actualizar(opcion.id, { option_value: resultado.valor }).subscribe({
        next: () => {
          this.recargarActual();
          this.mostrarMensaje('Opción actualizada');
        },
        error: (err) => {
          this.cargando = false;
          this.mostrarMensaje(this.textoError(err));
          this.refrescar();
        },
      });
    } else {
      // Agregar
      const valoresHabito = this.valoresPorHabito[this.habitoActual] ?? [];
      if (this.servicio.existeDuplicado(valoresHabito, campo.section, campo.field_name, resultado.valor)) {
        this.mostrarMensaje('Esa opción ya existe en este campo');
        this.cerrarModalOpcion();
        return;
      }

      const nuevoOrden = campo.opciones.length
        ? Math.max(...campo.opciones.map((o) => o.display_order)) + 1
        : 0;

      this.cargando = true;
      this.cerrarModalOpcion();
      this.refrescar();

      this.servicio.crear({
        habit: this.habitoActual,
        section: campo.section,
        field_name: campo.field_name,
        option_value: resultado.valor,
        selection_type: campo.selection_type,
        field_type: campo.field_type,
        is_required: campo.is_required,
        display_order: nuevoOrden,
      }).subscribe({
        next: () => {
          this.recargarActual();
          this.mostrarMensaje('Opción agregada');
        },
        error: (err) => {
          this.cargando = false;
          this.mostrarMensaje(this.textoError(err));
          this.refrescar();
        },
      });
    }
  }


  // ---- Helpers ----

  private limpiarCacheHabitos(habitos: string[]): void {
    for (const h of habitos) {
      delete this.valoresPorHabito[h];
      delete this.seccionesPorHabito[h];
    }
    this.refrescar();
  }

  private textoError(err: unknown): string {
    const e = err as { status?: number; error?: { message?: string } };
    if (e?.status === 409) return 'Ese valor ya existe en el mismo contexto';
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