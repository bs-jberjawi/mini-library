import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Book, CheckoutHistory } from '../../models/interfaces';
import { BookService } from '../../services/book.service';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';
import { BookDialogComponent } from '../../components/book-dialog/book-dialog.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatButtonModule, MatIconModule, MatCardModule, MatChipsModule,
    MatDividerModule, MatProgressSpinnerModule, MatDialogModule,
  ],
  template: `
    <div class="book-detail">
      @if (loading()) {
        <div class="center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (book(); as b) {
        <button mat-button routerLink="/books" class="back-btn">
          <mat-icon>arrow_back</mat-icon> Back to Books
        </button>

        <div class="detail-layout">
          <div class="cover-section">
            <div class="book-cover-large" [style.background-color]="getCoverColor(b.title)">
              @if (b.cover_url) {
                <img [src]="b.cover_url" [alt]="b.title">
              } @else {
                <span class="cover-letter">{{ b.title[0] }}</span>
              }
            </div>
            <div class="actions">
              @if (!b.is_checked_out && supabase.isAuthenticated()) {
                <button mat-raised-button color="primary" (click)="checkout()">
                  <mat-icon>shopping_cart</mat-icon> Borrow This Book
                </button>
              }
              @if (b.is_checked_out && b.checked_out_by === supabase.user()?.id) {
                <button mat-raised-button color="accent" (click)="returnBook()">
                  <mat-icon>assignment_return</mat-icon> Return This Book
                </button>
              }
              @if (b.is_checked_out && b.checked_out_by !== supabase.user()?.id) {
                <button mat-stroked-button disabled>
                  <mat-icon>block</mat-icon> Currently Unavailable
                </button>
              }
              @if (supabase.canManageBooks()) {
                <div class="admin-actions">
                  <button mat-stroked-button (click)="editBook()">
                    <mat-icon>edit</mat-icon> Edit
                  </button>
                  <button mat-stroked-button color="warn" (click)="deleteBook()">
                    <mat-icon>delete</mat-icon> Delete
                  </button>
                </div>
              }
            </div>
          </div>

          <div class="info-section">
            <h1>{{ b.title }}</h1>
            <p class="author">by {{ b.author }}</p>

            <div class="meta-chips">
              @if (b.genre) {
                <span class="meta-chip genre">{{ b.genre }}</span>
              }
              <span class="meta-chip" [class.available]="!b.is_checked_out" [class.checked-out]="b.is_checked_out">
                {{ b.is_checked_out ? 'Checked Out' : 'Available' }}
              </span>
            </div>

            @if (b.description) {
              <mat-divider></mat-divider>
              <h3>Description</h3>
              <p class="description">{{ b.description }}</p>
            }

            <mat-divider></mat-divider>
            <h3>Details</h3>
            <div class="details-grid">
              @if (b.isbn) {
                <div class="detail-item">
                  <span class="label">ISBN</span>
                  <span>{{ b.isbn }}</span>
                </div>
              }
              @if (b.published_year) {
                <div class="detail-item">
                  <span class="label">Published</span>
                  <span>{{ b.published_year }}</span>
                </div>
              }
              @if (b.page_count) {
                <div class="detail-item">
                  <span class="label">Pages</span>
                  <span>{{ b.page_count }}</span>
                </div>
              }
              @if (b.is_checked_out && b.checked_out_profile) {
                <div class="detail-item">
                  <span class="label">Borrowed by</span>
                  <span>{{ b.checked_out_profile.full_name || b.checked_out_profile.email }}</span>
                </div>
              }
              @if (b.checked_out_at) {
                <div class="detail-item">
                  <span class="label">Borrowed on</span>
                  <span>{{ b.checked_out_at | date:'medium' }}</span>
                </div>
              }
            </div>

            @if (history().length > 0) {
              <mat-divider></mat-divider>
              <h3>Checkout History</h3>
              <div class="history-list">
                @for (h of history(); track h.id) {
                  <div class="history-item">
                    <mat-icon>{{ h.returned_at ? 'check_circle' : 'schedule' }}</mat-icon>
                    <div>
                      <span class="history-user">{{ h.profile?.full_name || h.profile?.email || 'Unknown' }}</span>
                      <span class="history-dates">
                        {{ h.checked_out_at | date:'mediumDate' }}
                        @if (h.returned_at) {
                          → {{ h.returned_at | date:'mediumDate' }}
                        } @else {
                          → Currently borrowing
                        }
                      </span>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .book-detail { padding: 1.5rem; max-width: 900px; margin: 0 auto; }
    .center { display: flex; justify-content: center; padding: 3rem; }
    .back-btn { margin-bottom: 1rem; }

    .detail-layout { display: flex; gap: 2rem; flex-wrap: wrap; }
    .cover-section { flex: 0 0 280px; }
    .info-section { flex: 1; min-width: 300px; }

    .book-cover-large {
      width: 280px; height: 380px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 12px; overflow: hidden; margin-bottom: 1rem;
    }
    .book-cover-large img { width: 100%; height: 100%; object-fit: cover; }
    .cover-letter { font-size: 5rem; font-weight: 700; color: white; text-transform: uppercase; }

    .actions { display: flex; flex-direction: column; gap: 0.5rem; }
    .admin-actions { display: flex; gap: 0.5rem; }

    h1 { margin: 0 0 0.25rem; }
    .author { color: var(--mat-sys-on-surface-variant); margin: 0 0 1rem; font-size: 1.1rem; }

    .meta-chips { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
    .meta-chip {
      padding: 4px 12px; border-radius: 16px; font-size: 0.85rem;
      background: var(--mat-sys-secondary-container); color: var(--mat-sys-on-secondary-container);
    }
    .meta-chip.available { background: #e8f5e9; color: #2e7d32; }
    .meta-chip.checked-out { background: #fff3e0; color: #e65100; }
    .meta-chip.genre { background: var(--mat-sys-tertiary-container); color: var(--mat-sys-on-tertiary-container); }

    mat-divider { margin: 1rem 0; }
    h3 { margin: 0.75rem 0 0.5rem; }
    .description { color: var(--mat-sys-on-surface-variant); line-height: 1.6; }

    .details-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem; }
    .detail-item { display: flex; flex-direction: column; }
    .detail-item .label { font-size: 0.75rem; color: var(--mat-sys-on-surface-variant); text-transform: uppercase; font-weight: 500; }

    .history-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .history-item { display: flex; align-items: center; gap: 0.5rem; }
    .history-item mat-icon { color: var(--mat-sys-primary); }
    .history-user { font-weight: 500; display: block; }
    .history-dates { font-size: 0.85rem; color: var(--mat-sys-on-surface-variant); }
  `],
})
export class BookDetailComponent implements OnInit {
  supabase = inject(SupabaseService);
  private bookService = inject(BookService);
  private notification = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialogService = inject(MatDialog);

  book = signal<Book | null>(null);
  history = signal<CheckoutHistory[]>([]);
  loading = signal(true);

  private coverColors = ['#1976d2', '#388e3c', '#d32f2f', '#7b1fa2', '#f57c00', '#0097a7', '#5d4037', '#455a64'];

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/books']); return; }

    try {
      const [b, h] = await Promise.all([
        this.bookService.getBook(id),
        this.bookService.getCheckoutHistory(id),
      ]);
      this.book.set(b);
      this.history.set(h as CheckoutHistory[]);
    } catch {
      this.notification.error('Book not found');
      this.router.navigate(['/books']);
    } finally {
      this.loading.set(false);
    }
  }

  getCoverColor(title: string): string {
    return this.coverColors[title.charCodeAt(0) % this.coverColors.length];
  }

  async checkout() {
    const b = this.book();
    if (!b) return;
    try {
      await this.bookService.checkoutBook(b.id);
      this.notification.success(`"${b.title}" borrowed!`);
      await this.reload();
    } catch {
      this.notification.error('Failed to borrow book');
    }
  }

  async returnBook() {
    const b = this.book();
    if (!b) return;
    try {
      await this.bookService.returnBook(b.id);
      this.notification.success(`"${b.title}" returned!`);
      await this.reload();
    } catch {
      this.notification.error('Failed to return book');
    }
  }

  editBook() {
    const b = this.book();
    if (!b) return;
    const ref = this.dialogService.open(BookDialogComponent, {
      width: '500px',
      data: { mode: 'edit', book: b },
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.reload();
    });
  }

  deleteBook() {
    const b = this.book();
    if (!b) return;
    const ref = this.dialogService.open(ConfirmDialogComponent, {
      data: { title: 'Delete Book', message: `Delete "${b.title}"?` },
    });
    ref.afterClosed().subscribe(async confirmed => {
      if (confirmed) {
        await this.bookService.deleteBook(b.id);
        this.notification.success('Book deleted');
        this.router.navigate(['/books']);
      }
    });
  }

  private async reload() {
    const id = this.book()?.id;
    if (!id) return;
    const [b, h] = await Promise.all([
      this.bookService.getBook(id),
      this.bookService.getCheckoutHistory(id),
    ]);
    this.book.set(b);
    this.history.set(h as CheckoutHistory[]);
  }
}
