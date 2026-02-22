import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { BookSearchResult } from './book.service';

export interface AICategorization {
  genre: string;
  description: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private chatHistory: ChatMessage[] = [];

  /**
   * Send a prompt to the Gemini API via server-side proxy (production)
   * or directly (local development).
   */
  private async generate(prompt: string): Promise<string> {
    if (environment.geminiApiKey) {
      // Local dev: call Gemini directly
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(environment.geminiApiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    }

    // Production: call server-side proxy
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) throw new Error('AI proxy request failed');
    const data = await res.json();
    return (data.text ?? '').trim();
  }

  /**
   * Auto-categorize a book by title and author.
   * Returns a suggested genre and description.
   */
  async categorizeBook(title: string, author: string): Promise<AICategorization> {
    const prompt = `You are a librarian assistant. Given a book title and author, provide a genre classification and a 2-sentence description.

Book: "${title}" by ${author}

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{"genre": "Genre Name", "description": "A brief 2-sentence description of the book."}`;

    try {
      const text = await this.generate(prompt);
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned) as AICategorization;
    } catch (e) {
      console.error('AI categorization failed:', e);
      return { genre: '', description: '' };
    }
  }

  /**
   * Natural language search: uses AI to match books from the library.
   * Returns IDs of matched books.
   */
  async naturalLanguageSearch(query: string, books: BookSearchResult[]): Promise<string[]> {
    const bookList = books.map(b =>
      `ID:${b.id} | "${b.title}" by ${b.author} | Genre: ${b.genre || 'Unknown'} | ${b.is_checked_out ? 'Checked Out' : 'Available'}`
    ).join('\n');

    const prompt = `You are a smart library search assistant. Given a user's natural language query and a list of books, return the IDs of books that best match the query.

User query: "${query}"

Available books:
${bookList}

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{"matched_ids": ["id1", "id2"]}

If no books match, return {"matched_ids": []}.`;

    try {
      const text = await this.generate(prompt);
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return parsed.matched_ids ?? [];
    } catch (e) {
      console.error('AI search failed:', e);
      return [];
    }
  }

  /**
   * Chat with the library assistant.
   * Provides context about the library's books and the user's checkouts.
   */
  async chat(
    userMessage: string,
    books: BookSearchResult[],
    userName: string
  ): Promise<string> {
    const bookList = books.map(b =>
      `- "${b.title}" by ${b.author} (${b.genre || 'Unknown'}) - ${b.is_checked_out ? 'Checked Out' : 'Available'}`
    ).join('\n');

    const systemContext = `You are a friendly and helpful library assistant for MiniLibrary. Your name is Libby.
You help users find books, get recommendations, and answer questions about the library.
Be concise but friendly. Use emojis sparingly.

Current user: ${userName}

Library inventory (${books.length} books):
${bookList}

Previous conversation:
${this.chatHistory.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'Libby'}: ${m.content}`).join('\n')}`;

    const prompt = `${systemContext}

User: ${userMessage}

Respond naturally as Libby the library assistant:`;

    try {
      const response = await this.generate(prompt);

      // Store in history
      this.chatHistory.push(
        { role: 'user', content: userMessage, timestamp: new Date() },
        { role: 'model', content: response, timestamp: new Date() }
      );

      return response;
    } catch (e) {
      console.error('AI chat failed:', e);
      return 'Sorry, I\'m having trouble thinking right now. Please try again in a moment!';
    }
  }

  clearChatHistory() {
    this.chatHistory = [];
  }
}
