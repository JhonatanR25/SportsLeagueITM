import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-section-card-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './section-card-header.component.html',
  styleUrl: './section-card-header.component.scss',
})
export class SectionCardHeaderComponent {
  @Input() eyebrow = '';
  @Input() title = '';
}
