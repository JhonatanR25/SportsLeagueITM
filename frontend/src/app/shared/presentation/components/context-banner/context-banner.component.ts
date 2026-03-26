import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-context-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './context-banner.component.html',
  styleUrl: './context-banner.component.scss',
})
export class ContextBannerComponent {
  @Input() fullWidth = false;
}
