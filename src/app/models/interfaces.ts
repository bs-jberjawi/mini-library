export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  genre: string | null;
  description: string | null;
  cover_url: string | null;
  page_count: number | null;
  published_year: number | null;
  is_checked_out: boolean;
  checked_out_by: string | null;
  checked_out_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  checked_out_profile?: Profile;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'librarian' | 'member';
  created_at: string;
  updated_at: string;
}

export interface CheckoutHistory {
  id: string;
  book_id: string;
  user_id: string;
  checked_out_at: string;
  returned_at: string | null;
  created_at: string;
  // Joined
  book?: Book;
  profile?: Profile;
}

export interface BookFormData {
  title: string;
  author: string;
  isbn: string;
  genre: string;
  description: string;
  cover_url: string;
  page_count: number | null;
  published_year: number | null;
}
