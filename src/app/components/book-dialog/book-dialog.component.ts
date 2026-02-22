import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Book, BookFormData } from '../../models/interfaces';
import { BookService } from '../../services/book.service';
import { GeminiService } from '../../services/gemini.service';
import { NotificationService } from '../../services/notification.service';

interface DialogData {
  mode: 'add' | 'edit';
  book?: Book;
}

@Component({
  selector: 'app-book-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatDialogModule, MatButtonModule, MatInputModule, MatFormFieldModule,
    MatIconModule, MatProgressSpinnerModule, MatTooltipModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'add' ? 'Add New Book' : 'Edit Book' }}</h2>
    <mat-dialog-content>
      <form class="book-form" #bookForm="ngForm">
        <div class="row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Title</mat-label>
            <input matInput [(ngModel)]="form.title" name="title" required>
          </mat-form-field>
        </div>

        <div class="row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Author</mat-label>
            <input matInput [(ngModel)]="form.author" name="author" required>
          </mat-form-field>
        </div>

        <!-- AI Auto-categorize button -->
        @if (form.title && form.author) {
          <div class="ai-section">
            <button mat-stroked-button type="button" (click)="autoCategorize()"
                    [disabled]="categorizing()" matTooltip="Use AI to auto-fill genre and description">
              @if (categorizing()) {
                <mat-spinner diameter="18"></mat-spinner>
              } @else {
                <mat-icon>smart_toy</mat-icon>
              }
              AI Auto-fill
            </button>
          </div>
        }

        <div class="row two-cols">
          <mat-form-field appearance="outline">
            <mat-label>ISBN</mat-label>
            <input matInput [(ngModel)]="form.isbn" name="isbn">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Genre</mat-label>
            <input matInput [(ngModel)]="form.genre" name="genre">
          </mat-form-field>
        </div>

        <div class="row two-cols">
          <mat-form-field appearance="outline">
            <mat-label>Published Year</mat-label>
            <input matInput type="number" [(ngModel)]="form.published_year" name="published_year">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Page Count</mat-label>
            <input matInput type="number" [(ngModel)]="form.page_count" name="page_count">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Cover Image URL</mat-label>
          <input matInput [(ngModel)]="form.cover_url" name="cover_url" placeholder="https://...">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput [(ngModel)]="form.description" name="description" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="saving() || !form.title || !form.author">
        @if (saving()) {
          <mat-spinner diameter="18"></mat-spinner>
        } @else {
          {{ data.mode === 'add' ? 'Add Book' : 'Save Changes' }}
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .book-form { display: flex; flex-direction: column; gap: 0.25rem; min-width: 400px; }
    .row { display: flex; gap: 0.75rem; }
    .two-cols mat-form-field { flex: 1; }
    .full-width { width: 100%; }
    .ai-section { display: flex; justify-content: flex-end; margin: -0.5rem 0 0.5rem; }
    .ai-section button { display: flex; align-items: center; gap: 0.5rem; }
    mat-dialog-content { max-height: 70vh; }
  `],
})
export class BookDialogComponent {
  data = inject<DialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<BookDialogComponent>);
  private bookService = inject(BookService);
  private geminiService = inject(GeminiService);
  private notification = inject(NotificationService);

  saving = signal(false);
  categorizing = signal(false);

  form: BookFormData = {
    title: this.data.book?.title ?? '',
    author: this.data.book?.author ?? '',
    isbn: this.data.book?.isbn ?? '',
    genre: this.data.book?.genre ?? '',
    description: this.data.book?.description ?? '',
    cover_url: this.data.book?.cover_url ?? '',
    page_count: this.data.book?.page_count ?? null,
    published_year: this.data.book?.published_year ?? null,
  };

  async autoCategorize() {
    this.categorizing.set(true);
    try {
      const result = await this.geminiService.categorizeBook(this.form.title, this.form.author);
      if (result.genre && !this.form.genre) this.form.genre = result.genre;
      if (result.description && !this.form.description) this.form.description = result.description;
      this.notification.success('AI auto-fill complete!');
    } catch {
      this.notification.error('AI auto-fill failed');
    } finally {
      this.categorizing.set(false);
    }
  }

  async save() {
    this.saving.set(true);
    try {
      const payload: Partial<Book> = {
        title: this.form.title,
        author: this.form.author,
        isbn: this.form.isbn || null,
        genre: this.form.genre || null,
        description: this.form.description || null,
        cover_url: this.form.cover_url || null,
        page_count: this.form.page_count,
        published_year: this.form.published_year,
      };

      if (this.data.mode === 'add') {
        await this.bookService.createBook(payload);
        this.notification.success('Book added!');
      } else {
        await this.bookService.updateBook(this.data.book!.id, payload);
        this.notification.success('Book updated!');
      }
      this.dialogRef.close(true);
    } catch (e) {
      this.notification.error('Failed to save book');
    } finally {
      this.saving.set(false);
    }
  }
}
