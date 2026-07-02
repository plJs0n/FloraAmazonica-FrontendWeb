import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccionFila, ResultadoImportacion } from '../../../../modelos/especie-catalogo.modelo';

@Component({
  selector: 'app-vista-previa-importacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vista-previa-importacion.html',
  styleUrl: './vista-previa-importacion.css',
})
export class VistaPreviaImportacion implements OnChanges {
  @Input({ required: true }) resultado!: ResultadoImportacion;
  // Cuando el padre necesita forzar la apertura de una categoría (ej: "Revisar y confirmar").
  @Input() forzarCategoria: AccionFila | null = null;
  @Output() categoriaCambiada = new EventEmitter<AccionFila | null>();

  categoriaActiva = signal<AccionFila | null>(null);
  textoBusqueda = signal('');

  readonly categorias: { clave: AccionFila; etiqueta: string }[] = [
    { clave: 'nuevo', etiqueta: 'nuevos' },
    { clave: 'actualizado', etiqueta: 'actualizados' },
    { clave: 'conservado', etiqueta: 'conservados' },
    { clave: 'desactivado', etiqueta: 'desactivados' },
  ];

  readonly contadores = computed(() => ({
    nuevo: this.resultado.nuevos,
    actualizado: this.resultado.actualizados,
    conservado: this.resultado.conservados,
    desactivado: this.resultado.desactivados,
  }));

  readonly filasCategoriaActiva = computed(() => {
    const categoria = this.categoriaActiva();
    if (!categoria) return [];

    const texto = this.textoBusqueda().trim().toLowerCase();
    return this.resultado.preview
      .filter((fila) => fila.action === categoria)
      .filter(
        (fila) =>
          !texto ||
          fila.scientific_name.toLowerCase().includes(texto) ||
          fila.family.toLowerCase().includes(texto),
      );
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['forzarCategoria'] && this.forzarCategoria) {
      this.abrirCategoria(this.forzarCategoria);
    }
  }

  alternarCategoria(categoria: AccionFila): void {
    const nueva = this.categoriaActiva() === categoria ? null : categoria;
    this.abrirCategoria(nueva);
  }

  private abrirCategoria(categoria: AccionFila | null): void {
    this.categoriaActiva.set(categoria);
    this.textoBusqueda.set('');
    this.categoriaCambiada.emit(categoria);
  }
}