import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Shell } from './shell';

describe('Shell', () => {
  let fixture: ComponentFixture<Shell>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(Shell);
    fixture.detectChanges();
  });

  it('shows the sidebar next to the page outlet', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-sidebar')).not.toBeNull();
    expect(element.querySelector('main router-outlet')).not.toBeNull();
  });
});