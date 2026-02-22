import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { SupabaseService } from '../services/supabase.service';
import { ThemeService } from '../services/theme.service';
import { ChatbotComponent } from '../components/chatbot/chatbot.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatButtonModule, MatIconModule, MatSidenavModule,
    MatListModule, MatTooltipModule, MatMenuModule,
    ChatbotComponent,
  ],
  template: `
    <mat-sidenav-container class="app-container">
      <mat-sidenav #sidenav mode="side" opened class="sidenav" [fixedInViewport]="true">
        <div class="sidenav-header">
          <span class="material-icons">local_library</span>
          <span class="app-name">MiniLibrary</span>
        </div>
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
          <a mat-list-item routerLink="/books" routerLinkActive="active">
            <mat-icon matListItemIcon>menu_book</mat-icon>
            <span matListItemTitle>Books</span>
          </a>
          <a mat-list-item routerLink="/my-checkouts" routerLinkActive="active">
            <mat-icon matListItemIcon>history</mat-icon>
            <span matListItemTitle>My Checkouts</span>
          </a>
          @if (supabase.isAdmin()) {
            <a mat-list-item routerLink="/manage-users" routerLinkActive="active">
              <mat-icon matListItemIcon>people</mat-icon>
              <span matListItemTitle>Manage Users</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary" class="app-toolbar">
          <button mat-icon-button (click)="sidenav.toggle()">
            <mat-icon>menu</mat-icon>
          </button>
          <span class="toolbar-spacer"></span>

          <button mat-icon-button (click)="theme.toggle()" [matTooltip]="theme.isDark() ? 'Light mode' : 'Dark mode'">
            <mat-icon>{{ theme.isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>

          <button mat-icon-button [matMenuTriggerFor]="userMenu">
            @if (supabase.profile()?.avatar_url) {
              <img [src]="supabase.profile()?.avatar_url" class="toolbar-avatar" alt="Avatar">
            } @else {
              <mat-icon>account_circle</mat-icon>
            }
          </button>
          <mat-menu #userMenu="matMenu">
            <div class="user-menu-header" mat-menu-item disabled>
              <strong>{{ supabase.profile()?.full_name || 'User' }}</strong>
              <br>
              <small>{{ supabase.profile()?.email }}</small>
              <br>
              <span class="role-badge role-{{ supabase.userRole() }}">{{ supabase.userRole() | uppercase }}</span>
            </div>
            <button mat-menu-item (click)="signOut()">
              <mat-icon>logout</mat-icon>
              <span>Sign Out</span>
            </button>
          </mat-menu>
        </mat-toolbar>

        <main class="main-content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>

    <app-chatbot />
  `,
  styles: [`
    .app-container { height: 100vh; }

    .sidenav {
      width: 240px;
      border-right: 1px solid var(--mat-sys-outline-variant);
    }
    .sidenav-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.25rem 1rem;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }
    .sidenav-header .material-icons { font-size: 2rem; color: var(--mat-sys-primary); }
    .sidenav-header .app-name { font-size: 1.25rem; font-weight: 600; }

    :host ::ng-deep mat-nav-list a.active {
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }

    .app-toolbar { position: sticky; top: 0; z-index: 100; }
    .toolbar-spacer { flex: 1; }
    .toolbar-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }

    .user-menu-header { padding: 0.5rem 1rem; line-height: 1.5; white-space: normal !important; }
    .role-badge {
      display: inline-block; padding: 2px 8px; border-radius: 10px;
      font-size: 0.7rem; font-weight: 600; margin-top: 4px;
    }
    :host ::ng-deep .role-admin { background: #e8eaf6; color: #283593; }
    :host ::ng-deep .role-librarian { background: #e8f5e9; color: #2e7d32; }
    :host ::ng-deep .role-member { background: #fff3e0; color: #e65100; }

    .main-content { min-height: calc(100vh - 64px); background: var(--mat-sys-surface); }
  `],
})
export class LayoutComponent {
  supabase = inject(SupabaseService);
  theme = inject(ThemeService);
  private router = inject(Router);

  async signOut() {
    await this.supabase.signOut();
    this.router.navigate(['/login']);
  }
}
