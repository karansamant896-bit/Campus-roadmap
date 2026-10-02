# Campus Roadmap — Next.js

Next.js App Router version of the existing Campus Roadmap frontend.

## Setup

1. Install Node.js 18+.
2. Copy `.env.example` to `.env.local`.
3. Put the existing Supabase project URL and publishable key into `.env.local`.
4. Run `npm install`.
5. Run `npm run dev`.
6. Open `http://localhost:3000`.

The existing Supabase `contributions`, `published_notes`, and private `notes` bucket can be used as-is. The public client uses the Supabase publishable key; Row Level Security remains the access control layer.
