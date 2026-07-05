import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BloqueCatalogo } from './bloque-catalogo';

describe('BloqueCatalogo', () => {
  let component: BloqueCatalogo;
  let fixture: ComponentFixture<BloqueCatalogo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BloqueCatalogo],
    }).compileComponents();

    fixture = TestBed.createComponent(BloqueCatalogo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
