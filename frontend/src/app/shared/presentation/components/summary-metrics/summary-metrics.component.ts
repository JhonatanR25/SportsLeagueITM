import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type SummaryMetricItem = {
  label: string;
  value: string | number;
  variant?: 'number' | 'copy';
};

@Component({
  selector: 'app-summary-metrics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summary-metrics.component.html',
  styleUrl: './summary-metrics.component.scss',
})
export class SummaryMetricsComponent {
  @Input() ariaLabel = 'Resumen';
  @Input() items: SummaryMetricItem[] = [];
}
