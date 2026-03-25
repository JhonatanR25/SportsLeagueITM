export type ToastType = 'success' | 'error';

export type ToastNotification = {
  id: number;
  type: ToastType;
  title: string;
  message: string;
};
