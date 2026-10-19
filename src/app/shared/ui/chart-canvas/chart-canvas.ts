import { Component, DestroyRef, effect, ElementRef, inject, input } from "@angular/core";
import { ArcElement, BarController, BarElement, CategoryScale, Chart, DoughnutController, Legend, LinearScale, Tooltip } from "chart.js";

Chart.register(BarController, BarElement, DoughnutController, ArcElement, CategoryScale, LinearScale, Tooltip, Legend);

const DEFAULT_COLORS = [ '#0d6efd', '#198754', '#ffc107', '#0dcaf0', '#6c757d'];

@Component({
    selector: 'app-chart-canvas',
    template: '',
    host: { class: 'd-block position-relative', style: 'height: 18rem'},
})
export class ChartCanvas {
    readonly type = input.required<'bar' | 'doughnut'>();
    readonly labels = input.required<string[]>();
    readonly values = input.required<number[]>();
    readonly datasetLabel = input('');
    readonly description = input('');
    readonly colors = input<string[]>(DEFAULT_COLORS);

    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
    private chart : Chart | null = null;

    constructor() {
        effect(() => {
            const values = this.values();
            const colors = this.colors();

            this.chart?.destroy();
            const canvas = document.createElement('canvas');
            canvas.setAttribute('role', 'img');
            canvas.setAttribute('aria-label', this.description());

            this.host.nativeElement.replaceChildren(canvas);

            this.chart = new Chart(canvas, {
                type: this.type(),
                data: {
                    labels: this.labels(),
                    datasets: [{
                        label: this.datasetLabel(),
                        data: values,
                        backgroundColor: values.map((_, index) => colors[index % colors.length]),
                    }],
                },
                options: { responsive: true, maintainAspectRatio: false, animation: false },
            });
        });

        inject(DestroyRef).onDestroy(() => this.chart?.destroy());
    }
}