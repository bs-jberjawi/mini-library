import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _notifications = signal<Notification[]>([]);
  private counter = 0;

  notifications = this._notifications.asReadonly();

  show(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const id = ++this.counter;
    this._notifications.update(list => [...list, { id, message, type }]);
    setTimeout(() => this.dismiss(id), 4000);
  }

  success(message: string) { this.show(message, 'success'); }
  error(message: string) { this.show(message, 'error'); }
  info(message: string) { this.show(message, 'info'); }

  dismiss(id: number) {
    this._notifications.update(list => list.filter(n => n.id !== id));
  }
}
