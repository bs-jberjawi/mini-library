import { Injectable } from '@angular/core';
import { Book } from '../models/interfaces';
import { SupabaseService } from './supabase.service';

export interface BookSearchResult {
  id: string;
  title: string;
  author: string;
  is_checked_out: boolean;
  genre: string | null;
}

@Injectable({ providedIn: 'root' })
export class BookService {
  constructor(private supabase: SupabaseService) {}

  async getBooks(options?: {
    search?: string;
    genre?: string;
    available?: boolean;
    limit?: number;
    offset?: number;
  }) {
    let query = this.supabase.client
      .from('books')
      .select('*, checked_out_profile:profiles!books_checked_out_by_fkey(*)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (options?.search) {
      const s = `%${options.search}%`;
      query = query.or(`title.ilike.${s},author.ilike.${s},isbn.ilike.${s},genre.ilike.${s}`);
    }
    if (options?.genre) {
      query = query.eq('genre', options.genre);
    }
    if (options?.available !== undefined) {
      query = query.eq('is_checked_out', !options.available);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options?.limit ?? 20) - 1);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { books: (data ?? []) as Book[], count: count ?? 0 };
  }

  async getBook(id: string) {
    const { data, error } = await this.supabase.client
      .from('books')
      .select('*, checked_out_profile:profiles!books_checked_out_by_fkey(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Book;
  }

  async createBook(book: Partial<Book>) {
    const userId = this.supabase.user()?.id;
    const { data, error } = await this.supabase.client
      .from('books')
      .insert({ ...book, created_by: userId })
      .select()
      .single();
    if (error) throw error;
    return data as Book;
  }

  async updateBook(id: string, updates: Partial<Book>) {
    const { data, error } = await this.supabase.client
      .from('books')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Book;
  }

  async deleteBook(id: string) {
    const { error } = await this.supabase.client
      .from('books')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async checkoutBook(bookId: string) {
    const userId = this.supabase.user()?.id;
    if (!userId) throw new Error('Not authenticated');

    // Update book status
    const { error: bookError } = await this.supabase.client
      .from('books')
      .update({
        is_checked_out: true,
        checked_out_by: userId,
        checked_out_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookId)
      .eq('is_checked_out', false);
    if (bookError) throw bookError;

    // Create checkout history record
    const { error: historyError } = await this.supabase.client
      .from('checkout_history')
      .insert({
        book_id: bookId,
        user_id: userId,
        checked_out_at: new Date().toISOString(),
      });
    if (historyError) throw historyError;
  }

  async returnBook(bookId: string) {
    const userId = this.supabase.user()?.id;
    if (!userId) throw new Error('Not authenticated');

    // Update book status
    const { error: bookError } = await this.supabase.client
      .from('books')
      .update({
        is_checked_out: false,
        checked_out_by: null,
        checked_out_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookId);
    if (bookError) throw bookError;

    // Update checkout history record
    const { error: historyError } = await this.supabase.client
      .from('checkout_history')
      .update({ returned_at: new Date().toISOString() })
      .eq('book_id', bookId)
      .eq('user_id', userId)
      .is('returned_at', null);
    if (historyError) throw historyError;
  }

  async getCheckoutHistory(bookId?: string, userId?: string) {
    let query = this.supabase.client
      .from('checkout_history')
      .select('*, book:books(*), profile:profiles(*)')
      .order('checked_out_at', { ascending: false });

    if (bookId) query = query.eq('book_id', bookId);
    if (userId) query = query.eq('user_id', userId);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getGenres(): Promise<string[]> {
    const { data, error } = await this.supabase.client
      .from('books')
      .select('genre')
      .not('genre', 'is', null);
    if (error) throw error;
    const genres = [...new Set((data ?? []).map(b => b.genre).filter(Boolean))] as string[];
    return genres.sort();
  }

  async getDashboardStats() {
    const { data: books, error } = await this.supabase.client
      .from('books')
      .select('id, is_checked_out, genre');
    if (error) throw error;

    const total = books?.length ?? 0;
    const checkedOut = books?.filter(b => b.is_checked_out).length ?? 0;
    const available = total - checkedOut;

    // Genre counts
    const genreCounts: Record<string, number> = {};
    books?.forEach(b => {
      if (b.genre) {
        genreCounts[b.genre] = (genreCounts[b.genre] || 0) + 1;
      }
    });

    const topGenre = Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'N/A';

    return { total, checkedOut, available, genreCounts, topGenre };
  }

  async getAllBookSummaries(): Promise<BookSearchResult[]> {
    const { data, error } = await this.supabase.client
      .from('books')
      .select('id, title, author, is_checked_out, genre');
    if (error) throw error;
    return (data ?? []) as BookSearchResult[];
  }
}
