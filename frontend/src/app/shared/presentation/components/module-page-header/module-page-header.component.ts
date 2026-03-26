import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-module-page-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './module-page-header.component.html',
  styleUrl: './module-page-header.component.scss',
})
export class ModulePageHeaderComponent {
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() description = '';
}
