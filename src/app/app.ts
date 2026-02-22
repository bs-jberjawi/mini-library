import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { SupabaseService } from './services/supabase.service';
import { ThemeService } from './services/theme.service';
import { ChatbotComponent } from './components/chatbot/chatbot.component';
import { NotificationsComponent } from './components/notifications/notifications.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatButtonModule, MatIconModule, MatSidenavModule,
    MatListModule, MatTooltipModule, MatMenuModule,
    ChatbotComponent, NotificationsComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  supabase = inject(SupabaseService);
  theme = inject(ThemeService);

  async signOut() {
    await this.supabase.signOut();
  }
}
