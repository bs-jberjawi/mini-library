import { Component, inject, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GeminiService, ChatMessage } from '../../services/gemini.service';
import { BookService } from '../../services/book.service';
import { SupabaseService } from '../../services/supabase.service';
import { MarkdownPipe } from '../../pipes/markdown.pipe';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatProgressSpinnerModule, MarkdownPipe,
  ],
  template: `
    <!-- Floating toggle button -->
    @if (!isOpen()) {
      <button mat-fab color="primary" class="chat-fab" (click)="toggle()">
        <mat-icon>smart_toy</mat-icon>
      </button>
    }

    <!-- Chat panel -->
    @if (isOpen()) {
      <div class="chat-panel">
        <div class="chat-header">
          <mat-icon>smart_toy</mat-icon>
          <span>Libby - Library Assistant</span>
          <button mat-icon-button (click)="toggle()">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="chat-messages" #messagesContainer>
          <div class="chat-message model">
            <div class="message-bubble">
              Hi! I'm Libby, your library assistant. Ask me anything about our books, get recommendations, or check availability!
            </div>
          </div>
          @for (msg of messages(); track msg.timestamp) {
            <div class="chat-message" [class.user]="msg.role === 'user'" [class.model]="msg.role === 'model'">
              <div class="message-bubble" [innerHTML]="msg.content | markdown"></div>
            </div>
          }
          @if (thinking()) {
            <div class="chat-message model">
              <div class="message-bubble thinking">
                <mat-spinner diameter="16"></mat-spinner> Thinking...
              </div>
            </div>
          }
        </div>

        <div class="chat-input">
          <mat-form-field appearance="outline" class="input-field">
            <input matInput [(ngModel)]="userInput" (keyup.enter)="send()"
                   placeholder="Ask me anything..." [disabled]="thinking()">
          </mat-form-field>
          <button mat-icon-button color="primary" (click)="send()" [disabled]="thinking() || !userInput.trim()">
            <mat-icon>send</mat-icon>
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .chat-fab {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 1000;
    }

    .chat-panel {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      width: 380px;
      max-width: calc(100vw - 2rem);
      height: 500px;
      max-height: calc(100vh - 6rem);
      background: var(--mat-sys-surface-container);
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      display: flex;
      flex-direction: column;
      z-index: 1000;
      overflow: hidden;
    }

    .chat-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      font-weight: 500;
    }
    .chat-header span { flex: 1; }
    .chat-header button { color: var(--mat-sys-on-primary); }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .chat-message { display: flex; }
    .chat-message.user { justify-content: flex-end; }
    .chat-message.model { justify-content: flex-start; }

    .message-bubble {
      max-width: 80%;
      padding: 0.6rem 1rem;
      border-radius: 16px;
      font-size: 0.9rem;
      line-height: 1.4;
      white-space: pre-wrap;
    }
    .user .message-bubble {
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      border-bottom-right-radius: 4px;
    }
    .model .message-bubble {
      background: var(--mat-sys-surface-container-high);
      color: var(--mat-sys-on-surface);
      border-bottom-left-radius: 4px;
    }
    .thinking {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-style: italic;
      color: var(--mat-sys-on-surface-variant);
    }

    .chat-input {
      display: flex;
      align-items: center;
      padding: 0.5rem;
      gap: 0.25rem;
      border-top: 1px solid var(--mat-sys-outline-variant);
    }
    .input-field { flex: 1; margin: 0; }
    .input-field ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
  `],
})
export class ChatbotComponent {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  private geminiService = inject(GeminiService);
  private bookService = inject(BookService);
  private supabase = inject(SupabaseService);

  isOpen = signal(false);
  messages = signal<ChatMessage[]>([]);
  thinking = signal(false);
  userInput = '';

  toggle() {
    this.isOpen.update(v => !v);
  }

  async send() {
    const text = this.userInput.trim();
    if (!text) return;

    this.userInput = '';
    this.messages.update(msgs => [...msgs, { role: 'user', content: text, timestamp: new Date() }]);
    this.thinking.set(true);
    this.scrollToBottom();

    try {
      const books = await this.bookService.getAllBookSummaries();
      const userName = this.supabase.profile()?.full_name || 'Guest';
      const response = await this.geminiService.chat(text, books, userName);
      this.messages.update(msgs => [...msgs, { role: 'model', content: response, timestamp: new Date() }]);
    } catch {
      this.messages.update(msgs => [...msgs, {
        role: 'model',
        content: 'Sorry, something went wrong. Please try again!',
        timestamp: new Date(),
      }]);
    } finally {
      this.thinking.set(false);
      this.scrollToBottom();
    }
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.messagesContainer) {
        const el = this.messagesContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 50);
  }
}
