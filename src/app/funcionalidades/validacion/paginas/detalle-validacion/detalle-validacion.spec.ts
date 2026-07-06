import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleValidacion } from './detalle-validacion';

describe('DetalleValidacion', () => {
  let component: DetalleValidacion;
  let fixture: ComponentFixture<DetalleValidacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleValidacion],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalleValidacion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
