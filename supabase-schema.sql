-- ============================================================
-- MiniLibrary - Supabase Database Schema
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES TABLE (extends auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'librarian', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    'member'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. BOOKS TABLE
-- ============================================================
CREATE TABLE public.books (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT,
  genre TEXT,
  description TEXT,
  cover_url TEXT,
  page_count INTEGER,
  published_year INTEGER,
  is_checked_out BOOLEAN NOT NULL DEFAULT FALSE,
  checked_out_by UUID REFERENCES public.profiles(id),
  checked_out_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. CHECKOUT HISTORY TABLE
-- ============================================================
CREATE TABLE public.checkout_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  checked_out_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  returned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. INDEXES
-- ============================================================
CREATE INDEX idx_books_title ON public.books USING gin (to_tsvector('english', title));
CREATE INDEX idx_books_author ON public.books USING gin (to_tsvector('english', author));
CREATE INDEX idx_books_genre ON public.books (genre);
CREATE INDEX idx_books_checked_out ON public.books (is_checked_out);
CREATE INDEX idx_checkout_history_book ON public.checkout_history (book_id);
CREATE INDEX idx_checkout_history_user ON public.checkout_history (user_id);

-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_history ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- BOOKS policies
CREATE POLICY "Anyone can view books"
  ON public.books FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and librarian can insert books"
  ON public.books FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'librarian'))
  );

CREATE POLICY "Admin and librarian can update books"
  ON public.books FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'librarian'))
  );

CREATE POLICY "Members can update checkout status"
  ON public.books FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin and librarian can delete books"
  ON public.books FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'librarian'))
  );

-- CHECKOUT HISTORY policies
CREATE POLICY "Users can view all checkout history"
  ON public.checkout_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert checkout records"
  ON public.checkout_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkout records"
  ON public.checkout_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 6. SEED DATA (sample books)
-- ============================================================
INSERT INTO public.books (title, author, isbn, genre, description, published_year, page_count) VALUES
  ('To Kill a Mockingbird', 'Harper Lee', '978-0061120084', 'Fiction', 'A classic novel about racial inequality in the American South, seen through the eyes of young Scout Finch.', 1960, 281),
  ('1984', 'George Orwell', '978-0451524935', 'Dystopian', 'A dystopian novel set in a totalitarian society ruled by Big Brother, exploring themes of surveillance and freedom.', 1949, 328),
  ('The Great Gatsby', 'F. Scott Fitzgerald', '978-0743273565', 'Fiction', 'A tale of wealth, love, and the American Dream set in the Jazz Age of the 1920s.', 1925, 180),
  ('Pride and Prejudice', 'Jane Austen', '978-0141439518', 'Romance', 'A witty exploration of love, class, and social expectations in Regency-era England.', 1813, 279),
  ('The Hobbit', 'J.R.R. Tolkien', '978-0547928227', 'Fantasy', 'Bilbo Baggins embarks on an unexpected adventure with dwarves to reclaim their homeland from a dragon.', 1937, 310),
  ('Dune', 'Frank Herbert', '978-0441013593', 'Science Fiction', 'An epic saga of politics, religion, and ecology on the desert planet Arrakis.', 1965, 688),
  ('The Catcher in the Rye', 'J.D. Salinger', '978-0316769488', 'Fiction', 'A coming-of-age story following Holden Caulfield through New York City after being expelled from school.', 1951, 277),
  ('Brave New World', 'Aldous Huxley', '978-0060850524', 'Dystopian', 'A futuristic society where people are genetically engineered and socially conditioned for stability.', 1932, 311),
  ('The Lord of the Rings', 'J.R.R. Tolkien', '978-0618640157', 'Fantasy', 'The epic quest to destroy the One Ring and save Middle-earth from the Dark Lord Sauron.', 1954, 1178),
  ('Fahrenheit 451', 'Ray Bradbury', '978-1451673319', 'Dystopian', 'In a future society where books are banned, a fireman begins to question everything he knows.', 1953, 249),
  ('Crime and Punishment', 'Fyodor Dostoevsky', '978-0486415871', 'Classic', 'A psychological thriller about a young man who commits murder and grapples with guilt and redemption.', 1866, 671),
  ('The Alchemist', 'Paulo Coelho', '978-0062315007', 'Fiction', 'A philosophical novel about a shepherd boy who travels from Spain to Egypt in search of treasure.', 1988, 197);
