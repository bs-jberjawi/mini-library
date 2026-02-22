# MiniLibrary

A smart digital library management system built with Angular 19, Supabase, and Google Gemini AI.

![Angular](https://img.shields.io/badge/Angular-19-red)
![Supabase](https://img.shields.io/badge/Supabase-BaaS-green)
![Gemini](https://img.shields.io/badge/Gemini-AI-blue)

## Live Demo

> **URL:** [https://mini-library-xxxxx.vercel.app](https://mini-library-xxxxx.vercel.app)
> *(Replace with your actual Vercel URL after deployment)*

## Features

### Core Features
- **Book Management** — Add, edit, and delete books with rich metadata (title, author, ISBN, genre, description, cover, page count, year)
- **Check-in / Check-out** — Borrow and return books with full checkout history tracking
- **Search** — Search books by title, author, ISBN, or genre with case-insensitive filtering
- **Filtering** — Filter by genre and availability status

### AI-Powered Features (Google Gemini)
- **AI Auto-Categorization** — When adding a book, AI suggests genre and description from title + author
- **Natural Language Search** — Toggle "AI Search" to find books using natural language queries (e.g., *"dystopian novels about government control"*)
- **Smart Chatbot (Libby)** — Floating AI assistant that answers questions about the library, recommends books, and helps users

### Authentication & Authorization
- **Google SSO** — Sign in with Google via Supabase Auth
- **Role-Based Access Control** — Three roles:
  - **Admin** — Full access: manage books, manage users, assign roles
  - **Librarian** — Manage books (add/edit/delete), view users
  - **Member** — Browse books, borrow/return, use AI features

### Extra Features
- **Dashboard** — Stats overview with total books, availability, genre distribution chart
- **Dark Mode** — Toggle between light and dark themes
- **My Checkouts** — Personal checkout history with quick return action
- **User Management** — Admin page to assign roles to users
- **Toast Notifications** — Non-intrusive success/error feedback
- **Responsive Design** — Works on desktop and mobile
- **Book Cover Placeholders** — Colourful generated covers when no image is provided

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 19, Angular Material (M3), SCSS |
| Backend/API | Supabase (PostgreSQL, Auth, REST API, RLS) |
| AI | Google Gemini 2.0 Flash |
| Hosting | Vercel (frontend), Supabase (backend) |

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- A [Supabase](https://supabase.com) account (free tier)
- A [Google AI Studio](https://aistudio.google.com) account for Gemini API key (free)
- A [Google Cloud Console](https://console.cloud.google.com) project for OAuth2 credentials

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd mini-library
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase-schema.sql` — this creates all tables, indexes, RLS policies, and seed data
3. Go to **Authentication → Providers → Google** and enable it:
   - Create OAuth2 credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Set the authorized redirect URI to: `https://<your-project>.supabase.co/auth/v1/callback`
   - Paste the Client ID and Client Secret into Supabase
4. Go to **Authentication → URL Configuration** and add your frontend URL to allowed redirect URLs

### 3. Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Create API Key" (free, no credit card required)
3. Copy the key

### 4. Configure Environment

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://YOUR-PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR-SUPABASE-ANON-KEY',
  geminiApiKey: 'YOUR-GEMINI-API-KEY',
};
```

You can find your Supabase URL and anon key in **Project Settings → API**.

### 5. Run Locally

```bash
ng serve
```

Open [http://localhost:4200](http://localhost:4200).

### 6. First Login & Admin Setup

1. Sign in with Google
2. In Supabase Dashboard → **Table Editor → profiles**, find your user and change `role` to `admin`
3. Refresh the app — you'll now see admin features (Add Book, Manage Users, etc.)

## Deployment (Vercel)

### Option A: CLI

```bash
npm install -g vercel
vercel --prod
```

Set environment variables in Vercel Dashboard → Settings → Environment Variables:
- `NG_APP_SUPABASE_URL`
- `NG_APP_SUPABASE_ANON_KEY`
- `NG_APP_GEMINI_API_KEY`

> Note: For this assessment, the keys are embedded in the environment.ts files. In production, use Vercel environment variables with a custom webpack config.

### Option B: Git Integration

1. Push to GitHub
2. Import the repo in [vercel.com/new](https://vercel.com/new)
3. Set build command: `ng build`
4. Set output directory: `dist/mini-library/browser`
5. Deploy

After deploying, add the Vercel URL to Supabase Auth → Redirect URLs.

## Project Structure

```
src/
├── app/
│   ├── components/          # Shared components
│   │   ├── book-dialog/     # Add/Edit book dialog
│   │   ├── chatbot/         # AI chatbot (Libby)
│   │   ├── confirm-dialog/  # Confirmation dialog
│   │   └── notifications/   # Toast notifications
│   ├── guards/              # Route guards (auth, admin)
│   ├── models/              # TypeScript interfaces
│   ├── pages/               # Page components
│   │   ├── books/           # Book list + detail
│   │   ├── dashboard/       # Dashboard with stats
│   │   ├── login/           # Login page
│   │   ├── manage-users/    # Admin user management
│   │   └── my-checkouts/    # Personal checkout history
│   └── services/            # Core services
│       ├── book.service.ts      # Book CRUD & checkout operations
│       ├── gemini.service.ts    # Google Gemini AI integration
│       ├── notification.service.ts
│       ├── supabase.service.ts  # Auth & Supabase client
│       └── theme.service.ts     # Dark mode
├── environments/            # Environment config
└── supabase-schema.sql      # Database schema & seed data
```

## Architecture Decisions

- **Supabase over custom backend** — Eliminated all backend code (auth, DB, API, RLS are built-in), saving significant development time
- **Google Gemini over OpenAI** — Free tier with just a Google account, no credit card required
- **Angular standalone components** — Modern Angular with signals, lazy loading, and no NgModules
- **Supabase RLS** — Database-level security ensures data is protected even if the frontend is bypassed
- **Angular Material M3** — Pre-built UI components for rapid development with consistent design

## License

MIT
