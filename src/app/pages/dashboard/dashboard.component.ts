import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { BookService } from '../../services/book.service';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, RouterLink],
  template: `
    <div class="dashboard">
      <h1>Dashboard</h1>
      <p class="welcome">Welcome back, {{ supabase.profile()?.full_name || 'Reader' }}!</p>

      @if (loading()) {
        <div class="center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <div class="stats-grid">
          <mat-card class="stat-card" [routerLink]="'/books'">
            <mat-icon>menu_book</mat-icon>
            <div class="stat-value">{{ stats().total }}</div>
            <div class="stat-label">Total Books</div>
          </mat-card>
          <mat-card class="stat-card available">
            <mat-icon>check_circle</mat-icon>
            <div class="stat-value">{{ stats().available }}</div>
            <div class="stat-label">Available</div>
          </mat-card>
          <mat-card class="stat-card checked-out">
            <mat-icon>shopping_cart</mat-icon>
            <div class="stat-value">{{ stats().checkedOut }}</div>
            <div class="stat-label">Checked Out</div>
          </mat-card>
          <mat-card class="stat-card genre">
            <mat-icon>category</mat-icon>
            <div class="stat-value">{{ stats().topGenre }}</div>
            <div class="stat-label">Top Genre</div>
          </mat-card>
        </div>

        @if (genreEntries().length) {
          <h2>Books by Genre</h2>
          <div class="genre-bars">
            @for (entry of genreEntries(); track entry[0]) {
              <div class="genre-row">
                <span class="genre-name">{{ entry[0] }}</span>
                <div class="genre-bar-track">
                  <div class="genre-bar-fill" [style.width.%]="(entry[1] / stats().total) * 100"></div>
                </div>
                <span class="genre-count">{{ entry[1] }}</span>
              </div>
            }
          </div>
        }

        <div class="quick-actions">
          <h2>Quick Actions</h2>
          <div class="action-grid">
            <mat-card class="action-card" routerLink="/books">
              <mat-icon>search</mat-icon>
              <span>Browse Books</span>
            </mat-card>
            @if (supabase.canManageBooks()) {
              <mat-card class="action-card" routerLink="/books" fragment="add">
                <mat-icon>add_circle</mat-icon>
                <span>Add Book</span>
              </mat-card>
            }
            <mat-card class="action-card" routerLink="/my-checkouts">
              <mat-icon>history</mat-icon>
              <span>My Checkouts</span>
            </mat-card>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard { padding: 1.5rem; max-width: 1000px; margin: 0 auto; }
    h1 { margin: 0 0 0.25rem; }
    .welcome { color: var(--mat-sys-on-surface-variant); margin: 0 0 1.5rem; }
    .center { display: flex; justify-content: center; padding: 3rem; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      padding: 1.5rem;
      text-align: center;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .stat-card:hover { transform: translateY(-2px); }
    .stat-card mat-icon { font-size: 2rem; height: 2rem; width: 2rem; color: var(--mat-sys-primary); }
    .stat-card.available mat-icon { color: #4caf50; }
    .stat-card.checked-out mat-icon { color: #ff9800; }
    .stat-card.genre mat-icon { color: #9c27b0; }
    .stat-value { font-size: 2rem; font-weight: 700; margin: 0.5rem 0 0.25rem; }
    .stat-label { color: var(--mat-sys-on-surface-variant); font-size: 0.875rem; }

    h2 { margin: 1.5rem 0 1rem; }

    .genre-bars { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 2rem; }
    .genre-row { display: flex; align-items: center; gap: 0.75rem; }
    .genre-name { min-width: 120px; font-size: 0.875rem; text-align: right; }
    .genre-bar-track { flex: 1; height: 20px; background: var(--mat-sys-surface-variant); border-radius: 10px; overflow: hidden; }
    .genre-bar-fill { height: 100%; background: var(--mat-sys-primary); border-radius: 10px; min-width: 4px; transition: width 0.3s; }
    .genre-count { min-width: 30px; font-size: 0.875rem; font-weight: 500; }

    .action-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }
    .action-card {
      padding: 1.5rem;
      text-align: center;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .action-card:hover { transform: translateY(-2px); }
    .action-card mat-icon { font-size: 2rem; height: 2rem; width: 2rem; color: var(--mat-sys-primary); margin-bottom: 0.5rem; }
    .action-card span { display: block; font-size: 0.875rem; }
  `],
})
export class DashboardComponent implements OnInit {
  supabase = inject(SupabaseService);
  private bookService = inject(BookService);

  loading = signal(true);
  stats = signal({ total: 0, checkedOut: 0, available: 0, topGenre: 'N/A', genreCounts: {} as Record<string, number> });
  genreEntries = signal<[string, number][]>([]);

  async ngOnInit() {
    try {
      const s = await this.bookService.getDashboardStats();
      this.stats.set(s);
      this.genreEntries.set(
        Object.entries(s.genreCounts).sort(([, a], [, b]) => b - a)
      );
    } finally {
      this.loading.set(false);
    }
  }
}
