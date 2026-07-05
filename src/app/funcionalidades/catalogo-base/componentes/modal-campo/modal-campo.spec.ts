import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalCampo } from './modal-campo';

describe('ModalCampo', () => {
  let component: ModalCampo;
  let fixture: ComponentFixture<ModalCampo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalCampo],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalCampo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
