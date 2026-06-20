# Clay Notes — Frontend

A claymorphism-styled notes app: register, log in, and manage your own
private notes. Built as plain HTML/CSS/JS (no build step) so it can be
deployed as-is, and wired to use **Supabase** as the backend (auth +
database) instead of a custom server.

## Project structure

```
.
├── index.html          # Login page (site entry point)
├── signup.html         # Register page
├── dashboard.html       # Notes CRUD page (protected — redirects to login if not signed in)
├── css/
│   └── style.css        # Shared claymorphism design system
└── js/
    ├── supabaseClient.js  # Supabase project URL + anon key go here
    ├── auth.js             # Login + register logic
    └── dashboard.js        # Notes CRUD logic + auth guard + logout
```

## 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **Project Settings → API** and copy the **Project URL** and the
   **anon public** key.
3. Paste them into `js/supabaseClient.js`:

```js
const SUPABASE_URL = "https://xxxxx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOi...";
```

Never put the **service_role** key in frontend code — only the `anon` key
belongs here. Row Level Security (below) is what keeps people's data safe,
not secrecy of this key.

Email/password sign-in is enabled by default under
**Authentication → Providers → Email**. By default Supabase requires
email confirmation before a new account can log in — you can turn that
off in the same settings page while testing, or leave it on for
production.

## 2. Create the database schema

Open the **SQL Editor** in your Supabase project and run:

```sql
create extension if not exists "pgcrypto";

create table notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  content     text default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Row Level Security: this is what keeps each user's notes
-- separated from everyone else's, enforced at the database level.
alter table notes enable row level security;

create policy "Users can view their own notes"
  on notes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own notes"
  on notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own notes"
  on notes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own notes"
  on notes for delete
  using (auth.uid() = user_id);
```

This is the "simple database schema" plus the four CRUD-enabling RLS
policies (Create / Read / Update / Delete) — each policy checks that the
row's `user_id` matches the currently logged-in user, so nobody can ever
read or modify another person's notes, even by guessing IDs.

## 3. Run it locally

No build step needed. Either:

- Open `index.html` directly in a browser, or
- Serve the folder so relative paths behave (recommended):
  ```
  npx serve .
  ```

## 4. Deploy

**GitHub**
```
git init
git add .
git commit -m "Clay Notes frontend"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

**Vercel**
1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo.
2. Framework preset: **Other** (it's a static site — no build command needed).
3. Deploy. Vercel will serve `index.html` at the root automatically.

## How the pieces fit together

- **Auth**: `auth.js` calls `sb.auth.signUp()` and
  `sb.auth.signInWithPassword()` — Supabase handles password hashing,
  sessions, and tokens, so there's no custom auth backend to write.
- **Data separation**: every notes query in `dashboard.js` runs as the
  logged-in user, and the RLS policies above enforce on the database
  side that a user's queries can only ever touch their own rows.
- **CRUD**: `dashboard.js` performs the four operations directly against
  the `notes` table via `sb.from('notes').select/insert/update/delete()`
  — this *is* the backend integration; there's no separate API server
  required unless you want one later for extra business logic.

## Next steps

- Swap "notes" for whatever your real data model is — the same pattern
  (table + RLS policies + select/insert/update/delete calls) extends to
  contacts, tasks, inventory, etc.
- Add password-reset and email-change flows via `sb.auth.resetPasswordForEmail()`.
- If you outgrow direct Supabase calls from the frontend (e.g. you need
  server-side logic, webhooks, or third-party API keys kept secret),
  add Supabase Edge Functions or a small API layer in front of it.
