import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>
            <span class="material-icons logo-icon">local_library</span>
            MiniLibrary
          </mat-card-title>
          <mat-card-subtitle>Your smart digital library</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>Sign in to browse, borrow, and manage books with AI-powered features.</p>
          <div class="features">
            <div class="feature">
              <mat-icon>auto_stories</mat-icon>
              <span>Browse & borrow books</span>
            </div>
            <div class="feature">
              <mat-icon>smart_toy</mat-icon>
              <span>AI-powered search & recommendations</span>
            </div>
            <div class="feature">
              <mat-icon>manage_search</mat-icon>
              <span>Smart cataloging</span>
            </div>
          </div>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="signIn()" class="google-btn">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" height="20">
            Sign in with Google
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg,
        var(--mat-sys-primary-container) 0%,
        var(--mat-sys-surface) 100%);
    }
    .login-card {
      max-width: 440px;
      width: 90%;
      padding: 2rem;
    }
    mat-card-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.75rem !important;
    }
    .logo-icon {
      font-size: 2rem;
      color: var(--mat-sys-primary);
    }
    mat-card-content p {
      margin: 1rem 0;
      color: var(--mat-sys-on-surface-variant);
    }
    .features {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin: 1.5rem 0;
    }
    .feature {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
    }
    .feature mat-icon {
      color: var(--mat-sys-primary);
    }
    mat-card-actions {
      display: flex;
      justify-content: center;
      padding: 1rem 0 0;
    }
    .google-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 1.5rem;
      font-size: 1rem;
    }
  `],
})
export class LoginComponent {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  constructor() {
    // If already authenticated, redirect immediately
    if (this.supabase.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  async signIn() {
    try {
      await this.supabase.signInWithGoogle();
    } catch (e) {
      console.error('Login failed:', e);
    }
  }
}
