import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="notification-container">
      @for (n of notifications.notifications(); track n.id) {
        <div class="notification" [class]="n.type" (click)="notifications.dismiss(n.id)">
          <mat-icon>
            {{ n.type === 'success' ? 'check_circle' : n.type === 'error' ? 'error' : 'info' }}
          </mat-icon>
          <span>{{ n.message }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .notification-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 2000;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 360px;
    }
    .notification {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      animation: slideIn 0.3s ease-out;
      font-size: 0.9rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .success { background: #e8f5e9; color: #2e7d32; }
    .error { background: #ffebee; color: #c62828; }
    .info { background: #e3f2fd; color: #1565c0; }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `],
})
export class NotificationsComponent {
  notifications = inject(NotificationService);
}
