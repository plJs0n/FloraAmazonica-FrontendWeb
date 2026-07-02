import { Component, EventEmitter, Output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogoServicio } from '../../../servicios/catalogo.servicio';
import { AccionFila, ModoImportacion, ResultadoImportacion } from '../../../modelos/especie-catalogo.modelo';
import { VistaPreviaImportacion } from './vista-previa-importacion/vista-previa-importacion';

@Component({
  selector: 'app-carga-catalogo',
  standalone: true,
  imports: [CommonModule, VistaPreviaImportacion],
  templateUrl: './carga-catalogo.html',
  styleUrl: './carga-catalogo.css',
})
export class CargaCatalogo {
  @Output() cerrar = new EventEmitter<void>();
  @Output() importado = new EventEmitter<void>();

  readonly ModoImportacion = ModoImportacion;

  archivo = signal<File | null>(null);
  modo = signal<ModoImportacion>(ModoImportacion.REEMPLAZAR);

  cargandoPreview = signal(false);
  cargandoImportacion = signal(false);
  resultado = signal<ResultadoImportacion | null>(null);
  errorGeneral = signal<string | null>(null);

  // Controla si ya se le mostró al admin el detalle de "desactivados" antes de confirmar.
  desactivadosRevisados = signal(false);
  // Cuando carga-catalogo necesita que el hijo abra una categoría en particular
  // (ej: al presionar "Revisar y confirmar" por primera vez).
  categoriaForzada = signal<AccionFila | null>(null);

  readonly hayDesactivados = computed(() => (this.resultado()?.desactivados ?? 0) > 0);

  readonly textoBotonConfirmar = computed(() => {
    if (!this.hayDesactivados()) return 'Confirmar importación';
    return this.desactivadosRevisados() ? 'Confirmar de todos modos' : 'Revisar y confirmar';
  });

  constructor(private catalogoServicio: CatalogoServicio) {}

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;

    if (archivo && !archivo.name.toLowerCase().endsWith('.csv')) {
      this.errorGeneral.set('Solo se aceptan archivos CSV.');
      this.archivo.set(null);
      return;
    }

    this.errorGeneral.set(null);
    this.archivo.set(archivo);
    this.reiniciarResultado();
  }

  cambiarModo(modo: ModoImportacion): void {
    this.modo.set(modo);
    // Cambiar el modo invalida la vista previa anterior: ya no coincide con lo revisado.
    this.reiniciarResultado();
  }

  solicitarPreview(): void {
    const archivo = this.archivo();
    if (!archivo) return;

    this.cargandoPreview.set(true);
    this.errorGeneral.set(null);

    this.catalogoServicio.previsualizarImportacion(archivo, this.modo()).subscribe({
      next: (resultado) => {
        this.resultado.set(resultado);
        this.desactivadosRevisados.set(false);
        this.categoriaForzada.set(null);
        this.cargandoPreview.set(false);
      },
      error: () => {
        this.errorGeneral.set('No se pudo generar la vista previa. Verifica el archivo.');
        this.cargandoPreview.set(false);
      },
    });
  }

  onCategoriaCambiada(categoria: AccionFila | null): void {
    if (categoria === 'desactivado') this.desactivadosRevisados.set(true);
  }

  onClicConfirmar(): void {
    if (this.hayDesactivados() && !this.desactivadosRevisados()) {
      // Primer clic con desactivados sin revisar: solo forzar la apertura del detalle.
      this.categoriaForzada.set('desactivado');
      return;
    }
    this.confirmarImportacion();
  }

  cancelar(): void {
    this.cerrar.emit();
  }

  private reiniciarResultado(): void {
    this.resultado.set(null);
    this.desactivadosRevisados.set(false);
    this.categoriaForzada.set(null);
  }

  private confirmarImportacion(): void {
    const archivo = this.archivo();
    if (!archivo) return;

    this.cargandoImportacion.set(true);
    this.errorGeneral.set(null);

    this.catalogoServicio.importar(archivo, this.modo()).subscribe({
      next: () => {
        this.cargandoImportacion.set(false);
        this.importado.emit();
      },
      error: () => {
        this.errorGeneral.set('No se pudo completar la importación. Intenta nuevamente.');
        this.cargandoImportacion.set(false);
      },
    });
  }
}