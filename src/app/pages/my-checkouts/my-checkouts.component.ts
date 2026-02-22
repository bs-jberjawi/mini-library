import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BookService } from '../../services/book.service';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';
import { CheckoutHistory } from '../../models/interfaces';

@Component({
  selector: 'app-my-checkouts',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="page">
      <h1>My Checkouts</h1>

      @if (loading()) {
        <div class="center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (history().length === 0) {
        <div class="empty-state">
          <mat-icon>history</mat-icon>
          <p>You haven't borrowed any books yet.</p>
          <button mat-stroked-button routerLink="/books">Browse Books</button>
        </div>
      } @else {
        <div class="checkout-list">
          @for (h of history(); track h.id) {
            <mat-card class="checkout-card" [routerLink]="'/books/' + h.book_id">
              <div class="checkout-info">
                <mat-icon [class.active]="!h.returned_at">{{ h.returned_at ? 'check_circle' : 'schedule' }}</mat-icon>
                <div class="details">
                  <h3>{{ h.book?.title || 'Unknown Book' }}</h3>
                  <p class="author">{{ h.book?.author }}</p>
                  <p class="dates">
                    Borrowed: {{ h.checked_out_at | date:'mediumDate' }}
                    @if (h.returned_at) {
                      &nbsp;|&nbsp;Returned: {{ h.returned_at | date:'mediumDate' }}
                    }
                  </p>
                </div>
              </div>
              @if (!h.returned_at) {
                <button mat-stroked-button color="accent" (click)="returnBook(h, $event)">
                  <mat-icon>assignment_return</mat-icon> Return
                </button>
              }
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 1.5rem; max-width: 800px; margin: 0 auto; }
    .center { display: flex; justify-content: center; padding: 3rem; }
    .empty-state { text-align: center; padding: 3rem; color: var(--mat-sys-on-surface-variant); }
    .empty-state mat-icon { font-size: 4rem; height: 4rem; width: 4rem; }

    .checkout-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .checkout-card {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 1.5rem; cursor: pointer; transition: transform 0.2s;
    }
    .checkout-card:hover { transform: translateX(4px); }
    .checkout-info { display: flex; align-items: center; gap: 1rem; }
    .checkout-info mat-icon { font-size: 2rem; height: 2rem; width: 2rem; color: var(--mat-sys-on-surface-variant); }
    .checkout-info mat-icon.active { color: #ff9800; }
    h3 { margin: 0; }
    .author { margin: 0.125rem 0; color: var(--mat-sys-on-surface-variant); font-size: 0.9rem; }
    .dates { margin: 0; font-size: 0.8rem; color: var(--mat-sys-on-surface-variant); }
  `],
})
export class MyCheckoutsComponent implements OnInit {
  private bookService = inject(BookService);
  private supabase = inject(SupabaseService);
  private notification = inject(NotificationService);

  loading = signal(true);
  history = signal<CheckoutHistory[]>([]);

  async ngOnInit() {
    try {
      const userId = this.supabase.user()?.id;
      if (userId) {
        const h = await this.bookService.getCheckoutHistory(undefined, userId);
        this.history.set(h as CheckoutHistory[]);
      }
    } finally {
      this.loading.set(false);
    }
  }

  async returnBook(h: CheckoutHistory, event: Event) {
    event.stopPropagation();
    try {
      await this.bookService.returnBook(h.book_id);
      this.notification.success('Book returned!');
      // Refresh
      const userId = this.supabase.user()?.id;
      if (userId) {
        const updated = await this.bookService.getCheckoutHistory(undefined, userId);
        this.history.set(updated as CheckoutHistory[]);
      }
    } catch {
      this.notification.error('Failed to return book');
    }
  }
}
