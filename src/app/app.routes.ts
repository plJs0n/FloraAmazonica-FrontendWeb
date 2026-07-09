import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { rolGuard } from './core/guards/rol.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./funcionalidades/autenticacion/paginas/login/login').then(
        m => m.Login
      )
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/layout-principal/layout-principal').then(
        m => m.LayoutPrincipal
      ),
    children: [
      {
        path: 'usuarios',
        canActivate: [rolGuard],
        data: { roles: ['administrador'] },
        loadComponent: () =>
          import('./funcionalidades/usuarios/paginas/lista-usuarios/lista-usuarios').then(
            m => m.ListaUsuarios
          )
      },
      {
        path: 'registros',
        canActivate: [rolGuard],
        data: { roles: ['administrador'] },
        loadComponent: () =>
          import('./funcionalidades/administrador/registros/vista-registros-admin').then(
            m => m.VistaRegistrosAdmin
          )
      },
      {
        path: 'catalogo',
        canActivate: [rolGuard],
        data: { roles: ['administrador'] },
        children: [
          {
            path: 'familias-especies',
            loadComponent: () =>
              import('./funcionalidades/catalogo-base/paginas/familias-especies/familias-especies').then(
                m => m.FamiliasEspecies
              )
          },
          {
            path: 'formulario',
            loadComponent: () =>
              import('./funcionalidades/catalogo-base/paginas/formulario/formulario').then(
                m => m.Formulario
              )
          },
          {
            path: '',
            redirectTo: 'familias-especies',
            pathMatch: 'full'
          }
        ]
      },
      {
        path: 'validacion',
        canActivate: [rolGuard],
        data: { roles: ['validador'] },
        loadComponent: () =>
          import('./funcionalidades/validacion/paginas/lista-registros-pendientes/lista-registros-pendientes').then(
            m => m.ListaRegistrosPendientes
          )
      },
      {
        path: 'consulta',
        canActivate: [rolGuard],
        data: { roles: ['consultor'] },
        loadComponent: () =>
          import('./funcionalidades/consulta/paginas/buscador-morfologico/buscador-morfologico').then(
            m => m.BuscadorMorfologico
          )
      },
      {
        path: 'ficha-tecnica/:id',
        canActivate: [rolGuard],
        data: { roles: ['consultor'] },
        loadComponent: () =>
          import('./funcionalidades/consulta/paginas/ficha-tecnica/ficha-tecnica').then(
            m => m.FichaTecnica
          )
      },
      {
        path: 'mi-perfil',
        loadComponent: () =>
          import('./funcionalidades/perfil/paginas/mi-perfil/mi-perfil').then(
            m => m.MiPerfil
          )
      },
      {
        path: '',
        redirectTo: 'usuarios',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'no-autorizado',
    loadComponent: () =>
      import('./funcionalidades/autenticacion/paginas/login/login').then(
        m => m.Login
      )
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];