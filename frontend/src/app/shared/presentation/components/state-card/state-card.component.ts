import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-state-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './state-card.component.html',
  styleUrl: './state-card.component.scss',
})
export class StateCardComponent {
  @Input() label = '';
  @Input() title = '';
  @Input() tone: 'default' | 'error' = 'default';
  @Input() actionLabel = '';

  @Output() action = new EventEmitter<void>();

  protected onAction(): void {
    this.action.emit();
  }
}
