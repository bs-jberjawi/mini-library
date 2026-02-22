import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatBadgeModule } from '@angular/material/badge';
import { Book } from '../../models/interfaces';
import { BookService } from '../../services/book.service';
import { GeminiService } from '../../services/gemini.service';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';
import { BookDialogComponent } from '../../components/book-dialog/book-dialog.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule,
    MatSelectModule, MatChipsModule, MatCardModule, MatProgressSpinnerModule,
    MatDialogModule, MatTooltipModule, MatSlideToggleModule, MatBadgeModule,
  ],
  template: `
    <div class="book-list-page">
      <div class="header">
        <h1>Books</h1>
        @if (supabase.canManageBooks()) {
          <button mat-raised-button color="primary" (click)="openAddDialog()">
            <mat-icon>add</mat-icon> Add Book
          </button>
        }
      </div>

      <!-- Search bar -->
      <div class="search-section">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search books...</mat-label>
          <input matInput [(ngModel)]="searchQuery" (keyup.enter)="doSearch()"
                 placeholder="Search by title, author, ISBN, genre...">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-slide-toggle [(ngModel)]="aiSearchEnabled" class="ai-toggle">
          <mat-icon class="ai-icon">smart_toy</mat-icon> AI Search
        </mat-slide-toggle>

        <button mat-stroked-button (click)="doSearch()" [disabled]="searching()">
          @if (searching()) {
            <mat-spinner diameter="20"></mat-spinner>
          } @else {
            Search
          }
        </button>
      </div>

      <!-- Filters -->
      <div class="filters">
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Genre</mat-label>
          <mat-select [(ngModel)]="selectedGenre" (selectionChange)="doSearch()">
            <mat-option value="">All Genres</mat-option>
            @for (g of genres(); track g) {
              <mat-option [value]="g">{{ g }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Availability</mat-label>
          <mat-select [(ngModel)]="availabilityFilter" (selectionChange)="doSearch()">
            <mat-option value="">All</mat-option>
            <mat-option value="available">Available</mat-option>
            <mat-option value="checked-out">Checked Out</mat-option>
          </mat-select>
        </mat-form-field>

        @if (searchQuery || selectedGenre || availabilityFilter) {
          <button mat-button (click)="clearFilters()">
            <mat-icon>clear</mat-icon> Clear Filters
          </button>
        }
      </div>

      <!-- Results -->
      @if (loading()) {
        <div class="center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (books().length === 0) {
        <div class="empty-state">
          <mat-icon>menu_book</mat-icon>
          <p>No books found</p>
          @if (searchQuery) {
            <button mat-stroked-button (click)="clearFilters()">Clear search</button>
          }
        </div>
      } @else {
        <div class="books-grid">
          @for (book of books(); track book.id) {
            <mat-card class="book-card" (click)="viewBook(book)">
              <div class="book-cover" [style.background-color]="getCoverColor(book.title)">
                @if (book.cover_url) {
                  <img [src]="book.cover_url" [alt]="book.title">
                } @else {
                  <span class="cover-letter">{{ book.title[0] }}</span>
                }
              </div>
              <mat-card-content>
                <h3 class="book-title">{{ book.title }}</h3>
                <p class="book-author">{{ book.author }}</p>
                @if (book.genre) {
                  <span class="genre-chip">{{ book.genre }}</span>
                }
                <div class="book-status" [class.available]="!book.is_checked_out" [class.checked-out]="book.is_checked_out">
                  <mat-icon>{{ book.is_checked_out ? 'remove_shopping_cart' : 'check_circle' }}</mat-icon>
                  {{ book.is_checked_out ? 'Checked Out' : 'Available' }}
                </div>
              </mat-card-content>
              <mat-card-actions>
                @if (!book.is_checked_out && supabase.isAuthenticated()) {
                  <button mat-stroked-button color="primary" (click)="checkout(book, $event)">
                    <mat-icon>shopping_cart</mat-icon> Borrow
                  </button>
                }
                @if (book.is_checked_out && book.checked_out_by === supabase.user()?.id) {
                  <button mat-stroked-button color="accent" (click)="returnBook(book, $event)">
                    <mat-icon>assignment_return</mat-icon> Return
                  </button>
                }
                @if (supabase.canManageBooks()) {
                  <button mat-icon-button (click)="openEditDialog(book, $event)" matTooltip="Edit">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteBook(book, $event)" matTooltip="Delete">
                    <mat-icon>delete</mat-icon>
                  </button>
                }
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .book-list-page { padding: 1.5rem; max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .header h1 { margin: 0; }

    .search-section {
      display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.5rem;
    }
    .search-field { flex: 1; min-width: 250px; }
    .ai-toggle { display: flex; align-items: center; }
    .ai-icon { font-size: 1.2rem; height: 1.2rem; width: 1.2rem; margin-right: 0.25rem; vertical-align: middle; }

    .filters { display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; }
    .filter-field { width: 180px; }

    .center { display: flex; justify-content: center; padding: 3rem; }

    .empty-state {
      text-align: center; padding: 3rem; color: var(--mat-sys-on-surface-variant);
    }
    .empty-state mat-icon { font-size: 4rem; height: 4rem; width: 4rem; }

    .books-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1rem;
    }

    .book-card {
      cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;
      display: flex; flex-direction: column;
    }
    .book-card:hover { transform: translateY(-3px); box-shadow: 0 6px 16px rgba(0,0,0,0.12); }

    .book-cover {
      height: 140px; display: flex; align-items: center; justify-content: center;
      border-radius: 12px 12px 0 0; overflow: hidden;
    }
    .book-cover img { width: 100%; height: 100%; object-fit: cover; }
    .cover-letter {
      font-size: 3rem; font-weight: 700; color: white; text-transform: uppercase;
    }

    mat-card-content { flex: 1; padding: 0.75rem 1rem 0; }
    .book-title { margin: 0; font-size: 1rem; font-weight: 600; line-height: 1.3; }
    .book-author { margin: 0.25rem 0; font-size: 0.85rem; color: var(--mat-sys-on-surface-variant); }
    .genre-chip {
      display: inline-block; padding: 2px 8px; border-radius: 12px;
      font-size: 0.75rem; background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }
    .book-status {
      display: flex; align-items: center; gap: 0.25rem;
      font-size: 0.8rem; margin-top: 0.5rem;
    }
    .book-status mat-icon { font-size: 1rem; height: 1rem; width: 1rem; }
    .book-status.available { color: #4caf50; }
    .book-status.checked-out { color: #ff9800; }

    mat-card-actions { padding: 0.5rem; display: flex; gap: 0.25rem; align-items: center; }
  `],
})
export class BookListComponent implements OnInit {
  supabase = inject(SupabaseService);
  private bookService = inject(BookService);
  private geminiService = inject(GeminiService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  books = signal<Book[]>([]);
  genres = signal<string[]>([]);
  loading = signal(true);
  searching = signal(false);

  searchQuery = '';
  selectedGenre = '';
  availabilityFilter = '';
  aiSearchEnabled = false;

  private coverColors = ['#1976d2', '#388e3c', '#d32f2f', '#7b1fa2', '#f57c00', '#0097a7', '#5d4037', '#455a64'];

  async ngOnInit() {
    await Promise.all([this.loadBooks(), this.loadGenres()]);
  }

  async loadBooks() {
    this.loading.set(true);
    try {
      const { books } = await this.bookService.getBooks({
        search: !this.aiSearchEnabled ? this.searchQuery : undefined,
        genre: this.selectedGenre || undefined,
        available: this.availabilityFilter === 'available' ? true
                 : this.availabilityFilter === 'checked-out' ? false
                 : undefined,
      });
      this.books.set(books);
    } catch (e) {
      this.notification.error('Failed to load books');
    } finally {
      this.loading.set(false);
    }
  }

  async loadGenres() {
    try {
      this.genres.set(await this.bookService.getGenres());
    } catch { /* ignore */ }
  }

  async doSearch() {
    if (this.aiSearchEnabled && this.searchQuery.trim()) {
      this.searching.set(true);
      try {
        const allBooks = await this.bookService.getAllBookSummaries();
        const matchedIds = await this.geminiService.naturalLanguageSearch(this.searchQuery, allBooks);
        if (matchedIds.length === 0) {
          this.books.set([]);
          this.notification.info('AI found no matching books. Try a different query.');
        } else {
          const { books } = await this.bookService.getBooks();
          this.books.set(books.filter(b => matchedIds.includes(b.id)));
        }
      } catch {
        this.notification.error('AI search failed. Falling back to regular search.');
        await this.loadBooks();
      } finally {
        this.searching.set(false);
      }
    } else {
      await this.loadBooks();
    }
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedGenre = '';
    this.availabilityFilter = '';
    this.aiSearchEnabled = false;
    this.loadBooks();
  }

  getCoverColor(title: string): string {
    const idx = title.charCodeAt(0) % this.coverColors.length;
    return this.coverColors[idx];
  }

  viewBook(book: Book) {
    this.router.navigate(['/books', book.id]);
  }

  openAddDialog() {
    const ref = this.dialog.open(BookDialogComponent, {
      width: '500px',
      data: { mode: 'add' },
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.loadBooks();
    });
  }

  openEditDialog(book: Book, event: Event) {
    event.stopPropagation();
    const ref = this.dialog.open(BookDialogComponent, {
      width: '500px',
      data: { mode: 'edit', book },
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.loadBooks();
    });
  }

  async deleteBook(book: Book, event: Event) {
    event.stopPropagation();
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Book', message: `Are you sure you want to delete "${book.title}"?` },
    });
    ref.afterClosed().subscribe(async confirmed => {
      if (confirmed) {
        try {
          await this.bookService.deleteBook(book.id);
          this.notification.success('Book deleted');
          this.loadBooks();
        } catch {
          this.notification.error('Failed to delete book');
        }
      }
    });
  }

  async checkout(book: Book, event: Event) {
    event.stopPropagation();
    try {
      await this.bookService.checkoutBook(book.id);
      this.notification.success(`"${book.title}" borrowed successfully!`);
      this.loadBooks();
    } catch {
      this.notification.error('Failed to borrow book');
    }
  }

  async returnBook(book: Book, event: Event) {
    event.stopPropagation();
    try {
      await this.bookService.returnBook(book.id);
      this.notification.success(`"${book.title}" returned successfully!`);
      this.loadBooks();
    } catch {
      this.notification.error('Failed to return book');
    }
  }
}
