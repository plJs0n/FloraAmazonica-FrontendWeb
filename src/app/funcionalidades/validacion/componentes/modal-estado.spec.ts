import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalEstado } from './modal-estado';

describe('ModalEstado', () => {
  let component: ModalEstado;
  let fixture: ComponentFixture<ModalEstado>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalEstado],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalEstado);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
