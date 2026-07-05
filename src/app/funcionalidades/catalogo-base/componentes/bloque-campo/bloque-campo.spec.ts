import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BloqueCampo } from './bloque-campo';

describe('BloqueCampo', () => {
  let component: BloqueCampo;
  let fixture: ComponentFixture<BloqueCampo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BloqueCampo],
    }).compileComponents();

    fixture = TestBed.createComponent(BloqueCampo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
