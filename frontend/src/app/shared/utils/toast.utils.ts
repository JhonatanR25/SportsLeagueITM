import { WritableSignal } from '@angular/core';

import { ToastNotification, ToastType } from '../domain/models/toast-notification.model';

export function pushToastNotification(
  notifications: WritableSignal<ToastNotification[]>,
  dismiss: (notificationId: number) => void,
  type: ToastType,
  title: string,
  message: string,
  durationMs = 4500,
): void {
  const id = Date.now() + Math.floor(Math.random() * 1000);

  notifications.update((items) => [...items, { id, type, title, message }]);

  window.setTimeout(() => {
    dismiss(id);
  }, durationMs);
}
