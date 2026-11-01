import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthLayout } from './auth-layout';

describe('AuthLayout', () => {
  let component: AuthLayout;
  let fixture: ComponentFixture<AuthLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthLayout);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title','Accedi');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('shows the logo of the studio, with a text alternative and the size (no jump while it loads)', () => {
    const logo = (fixture.nativeElement as HTMLElement).querySelector('img.auth-logo') as HTMLImageElement;

    expect(logo.getAttribute('src')).toBe('brand/logo-full.png');
    expect(logo.getAttribute('alt')).toBe('Studio medico La Mole, Torino');
    expect(logo.getAttribute('width')).toBe('150');
    expect(logo.getAttribute('height')).toBe('174');
  });
  it('shows the title', () => {
    const heading = (fixture.nativeElement as HTMLElement).querySelector('h1');
    expect(heading?.textContent).toContain('Accedi');
  });
});
