import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-context-banner-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './context-banner-item.component.html',
  styleUrl: './context-banner-item.component.scss',
})
export class ContextBannerItemComponent {
  @Input() label = '';
  @Input() value: string | number = '';
}
