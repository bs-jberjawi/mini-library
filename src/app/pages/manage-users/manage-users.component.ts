import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Profile } from '../../models/interfaces';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatIconModule, MatButtonModule, MatSelectModule,
    MatProgressSpinnerModule, MatFormFieldModule,
  ],
  template: `
    <div class="page">
      <h1>Manage Users</h1>
      <p class="subtitle">Assign roles to control library access.</p>

      @if (loading()) {
        <div class="center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <div class="user-list">
          @for (user of users(); track user.id) {
            <mat-card class="user-card">
              <div class="user-info">
                @if (user.avatar_url) {
                  <img [src]="user.avatar_url" class="avatar" [alt]="user.full_name">
                } @else {
                  <div class="avatar-placeholder">
                    {{ (user.full_name || user.email || '?')[0] | uppercase }}
                  </div>
                }
                <div class="details">
                  <h3>{{ user.full_name || 'Unnamed User' }}</h3>
                  <p>{{ user.email }}</p>
                </div>
              </div>
              <mat-form-field appearance="outline" class="role-select">
                <mat-label>Role</mat-label>
                <mat-select [value]="user.role" (selectionChange)="updateRole(user, $event.value)">
                  <mat-option value="member">Member</mat-option>
                  <mat-option value="librarian">Librarian</mat-option>
                  <mat-option value="admin">Admin</mat-option>
                </mat-select>
              </mat-form-field>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 1.5rem; max-width: 800px; margin: 0 auto; }
    .subtitle { color: var(--mat-sys-on-surface-variant); }
    .center { display: flex; justify-content: center; padding: 3rem; }

    .user-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .user-card { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; }
    .user-info { display: flex; align-items: center; gap: 1rem; }
    .avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; }
    .avatar-placeholder {
      width: 48px; height: 48px; border-radius: 50%;
      background: var(--mat-sys-primary); color: var(--mat-sys-on-primary);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.25rem; font-weight: 600;
    }
    h3 { margin: 0; }
    p { margin: 0; font-size: 0.85rem; color: var(--mat-sys-on-surface-variant); }
    .role-select { width: 150px; margin: 0; }
    .role-select ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
  `],
})
export class ManageUsersComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private notification = inject(NotificationService);

  loading = signal(true);
  users = signal<Profile[]>([]);

  async ngOnInit() {
    try {
      const { data, error } = await this.supabase.client
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      this.users.set(data as Profile[]);
    } finally {
      this.loading.set(false);
    }
  }

  async updateRole(user: Profile, newRole: string) {
    try {
      const { error } = await this.supabase.client
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) throw error;
      this.notification.success(`${user.full_name || user.email} is now a ${newRole}`);
      // Update local state
      this.users.update(users =>
        users.map(u => u.id === user.id ? { ...u, role: newRole as Profile['role'] } : u)
      );
    } catch {
      this.notification.error('Failed to update role');
    }
  }
}
