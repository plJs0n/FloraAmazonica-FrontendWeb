import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AutenticacionServicio } from '../../core/servicios/autenticacion.servicio';

interface ElementoNav {
  etiqueta: string;
  ruta?: string;
  subElementos?: ElementoNav[];
}

@Component({
  selector: 'app-barra-lateral',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './barra-lateral.html',
  styleUrl: './barra-lateral.css',
})
export class BarraLateral {
  rol: string | null;
  elementosNav: ElementoNav[] = [];

  grupoFijado = signal<string | null>(null);

  constructor(private autenticacionServicio: AutenticacionServicio) {
    this.rol = this.autenticacionServicio.obtenerRol();
    this.elementosNav = this.obtenerElementosNav();
  }

  alternarGrupo(etiqueta: string): void {
    this.grupoFijado.set(this.grupoFijado() === etiqueta ? null : etiqueta);
  }

  grupoEstaFijado(etiqueta: string): boolean {
    return this.grupoFijado() === etiqueta;
  }

  cerrarGrupo(): void {
    this.grupoFijado.set(null);
  }

  private obtenerElementosNav(): ElementoNav[] {
    switch (this.rol) {
      case 'administrador':
        return [
          { etiqueta: 'Gestión de usuarios', ruta: '/usuarios' },
          { etiqueta: 'Registros', ruta: '/registros' },
          {
            etiqueta: 'Administrar catálogo',
            subElementos: [
              { etiqueta: 'Familias y especies', ruta: '/catalogo/familias-especies' },
              { etiqueta: 'Formulario', ruta: '/catalogo/formulario' },
            ],
          },
          { etiqueta: 'Mi perfil', ruta: '/mi-perfil' },
        ];
      case 'validador':
        return [
          { etiqueta: 'Validación', ruta: '/validacion' },
          { etiqueta: 'Mi perfil', ruta: '/mi-perfil' },
        ];

      case 'consultor':
        return [
          { etiqueta: 'Consulta', ruta: '/consulta' },
          { etiqueta: 'Mi perfil', ruta: '/mi-perfil' },
        ];

      case 'registrador':
        return [
          { etiqueta: 'Mi perfil', ruta: '/mi-perfil' },
        ];

      default:
        return [
          { etiqueta: 'Mi perfil', ruta: '/mi-perfil' },
        ];
    }
  }
}