import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export type ToastItem = {
  id: number;
  type: 'success' | 'error';
  title: string;
  message: string;
};

@Component({
  selector: 'app-toast-stack',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-stack.component.html',
  styleUrl: './toast-stack.component.scss',
})
export class ToastStackComponent {
  @Input() notifications: ToastItem[] = [];
  @Output() dismiss = new EventEmitter<number>();

  protected dismissNotification(notificationId: number): void {
    this.dismiss.emit(notificationId);
  }
}
