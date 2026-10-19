import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Chart } from 'chart.js';
import { ChartCanvas } from './chart-canvas';

describe('ChartCanvas', () => {
  let fixture: ComponentFixture<ChartCanvas>;

  const canvas = () => (fixture.nativeElement as HTMLElement).querySelector('canvas') as HTMLCanvasElement;
  const chart = () => Chart.getChart(canvas());

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ChartCanvas] }).compileComponents();
    fixture = TestBed.createComponent(ChartCanvas);
    fixture.componentRef.setInput('type', 'bar');
    fixture.componentRef.setInput('labels', ['Cardiologia', 'Dermatologia']);
    fixture.componentRef.setInput('values', [150, 80]);
    fixture.componentRef.setInput('datasetLabel', 'Fatturato');
    fixture.detectChanges();
  });

  it('draws the labels and the values it receives', () => {
    expect(chart()!.data.labels).toEqual(['Cardiologia', 'Dermatologia']);
    expect(chart()!.data.datasets[0].data).toEqual([150, 80]);
  });

  it('redraws when the data change', () => {
    fixture.componentRef.setInput('labels', ['Ortopedia']);
    fixture.componentRef.setInput('values', [40]);
    fixture.detectChanges();

    expect(chart()!.data.labels).toEqual(['Ortopedia']);
    expect(chart()!.data.datasets[0].data).toEqual([40]);
  });

  it('describes the chart for assistive technologies', () => {
    fixture.componentRef.setInput('description', 'Fatturato per specializzazione');
    fixture.detectChanges();

    expect(canvas().getAttribute('aria-label')).toBe('Fatturato per specializzazione');
    expect(canvas().getAttribute('role')).toBe('img');
  });

  it('destroys the chart together with the component', () => {
    const element = canvas();
    fixture.destroy();

    expect(Chart.getChart(element)).toBeUndefined();
  });
});