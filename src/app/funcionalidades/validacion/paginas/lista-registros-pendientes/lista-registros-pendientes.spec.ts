import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaRegistrosPendientes } from './lista-registros-pendientes';

describe('ListaRegistrosPendientes', () => {
  let component: ListaRegistrosPendientes;
  let fixture: ComponentFixture<ListaRegistrosPendientes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaRegistrosPendientes],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaRegistrosPendientes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
