import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalOpcion } from './modal-opcion';

describe('ModalOpcion', () => {
  let component: ModalOpcion;
  let fixture: ComponentFixture<ModalOpcion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalOpcion],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalOpcion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
