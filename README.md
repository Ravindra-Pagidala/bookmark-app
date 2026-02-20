# SmartMark — Real-Time Bookmark Manager

A fast, private bookmark manager built with **Next.js 14 (App Router)**, **Supabase**, and **TypeScript**. Bookmarks sync instantly across all open tabs in real-time — no page refresh needed.

---

## 🔗 Live Demo

**[→ https://smartmark-abc123.vercel.app]**

> Sign in with any Google account. Your bookmarks are completely private to you.

---

## ✅ Features

- 🔐 **Google OAuth** — one-click sign in, no passwords, no email verification
- ⚡ **Real-time sync** — open two tabs, add a bookmark in one, it appears in the other instantly
- 🔒 **Private by default** — Row Level Security in PostgreSQL ensures users can never see each other's data
- 🚀 **Optimistic UI** — bookmarks appear instantly before the server even responds
- 🔍 **Search & sort** — filter by title or URL, sort by newest or A–Z
- 🗑️ **Delete bookmarks** — with instant UI feedback and server-side verification
- 📱 **Responsive** — works on mobile and desktop

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 14 (App Router) | Server components, middleware, file-based routing |
| Language | TypeScript | Type safety, fewer runtime bugs |
| Auth | Supabase Auth (Google OAuth) | Handles OAuth flow, JWT tokens, session management |
| Database | Supabase (PostgreSQL) | Row Level Security enforced at DB level |
| Real-time | Supabase Realtime (WebSockets) | Listens to PostgreSQL WAL for instant event broadcasting |
| Styling | Tailwind CSS + Custom CSS | Utility classes + custom design system |
| Deployment | Vercel | Auto-deploy from GitHub, edge network |

---

## 🏗️ Project Structure

```
app/
├── globals.css                  # Design system — colors, components, animations
├── layout.tsx                   # Root HTML shell, font loading
├── page.tsx                     # "/" route → redirects to /login
├── login/
│   └── page.tsx                 # Login page with Google OAuth button
├── bookmarks/
│   └── page.tsx                 # Protected bookmarks page
├── components/
│   ├── navigation-bar.tsx       # Top navbar — logo, user chip, sign out
│   ├── bookmark-list.tsx        # Grid, toolbar, search, sort, add modal
│   └── bookmark-card.tsx        # Individual bookmark card — click to open URL
├── hooks/
│   ├── use-auth-hook.ts         # Auth state, Google sign-in, sign-out
│   └── use-bookmarks-hook.ts    # Bookmark CRUD + Realtime subscription
├── lib/
│   ├── supabase.ts              # Supabase client singleton
│   ├── auth.ts                  # AuthService class
│   ├── db.ts                    # BookmarkRepository class
│   └── utils/logger.ts          # Structured console logger
└── types/index.ts               # TypeScript interfaces
middleware.ts                    # Server-side route protection
```

---

## ⚙️ Local Development Setup

### Prerequisites
- Node.js 18+
- A Supabase account (free tier is enough)
- A Google Cloud account

---

### Step 1 — Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/smartmark.git
cd smartmark
npm install
```

---

### Step 2 — Supabase Setup

#### 2a. Create project
Go to [supabase.com](https://supabase.com) → New Project → give it a name and password → wait ~2 min.

#### 2b. Create the database table
Go to **SQL Editor** and run:

```sql
CREATE TABLE bookmarks (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title      TEXT NOT NULL,
  url        TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

#### 2c. Enable Row Level Security

```sql
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own bookmarks"
ON bookmarks FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own bookmarks"
ON bookmarks FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own bookmarks"
ON bookmarks FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own bookmarks"
ON bookmarks FOR DELETE TO authenticated
USING (user_id = auth.uid());
```

#### 2d. Enable Realtime
Go to **Database → Replication** → find the `bookmarks` table → toggle it **ON** under `supabase_realtime`.

> ⚠️ Without this step, real-time sync will not work even if the code is correct.
> The table must be added to the `supabase_realtime` publication for Supabase to broadcast change events.

#### 2e. Get your API keys
Go to **Settings → API**:
- Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### Step 3 — Google OAuth Setup

#### 3a. Google Cloud Console
1. Go to [console.cloud.google.com](https://console.cloud.google.com) → New Project
2. Go to **APIs & Services → OAuth consent screen** → External → fill in app name + email → Save
3. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
4. Copy the **Client ID** and **Client Secret**

#### 3b. Add to Supabase
Go to **Supabase → Authentication → Providers → Google** → toggle ON → paste Client ID + Secret → Save.

---

### Step 4 — Environment variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here
```

> `.env.local` is in `.gitignore` — it will never be committed to GitHub.

---

### Step 5 — Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🚀 Deploying to Vercel

### Step 1 — Push to GitHub

```bash
git add .
git commit -m "feat: SmartMark initial implementation"
git push origin main
```

### Step 2 — Import on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your GitHub repo
2. Framework: **Next.js** (auto-detected)
3. Add environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL      = https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key
   ```
4. Click **Deploy** → copy your live URL

### Step 3 — Update Supabase redirect URLs

Go to **Supabase → Authentication → URL Configuration**:
- **Site URL**: `https://your-smartmark-app.vercel.app`
- **Redirect URLs**: add `https://your-smartmark-app.vercel.app/bookmarks`
  *(keep `http://localhost:3000/bookmarks` too so local dev still works)*

### Step 4 — Update Google Cloud

Go to your OAuth client → add to **Authorized JavaScript origins**: `https://your-smartmark-app.vercel.app`

---

## 🐛 Problems I Ran Into & How I Solved Them

This is a full account of every real bug encountered during development — what caused it, how I debugged it, and what changed to fix it.

---

### Problem 1 — RLS INSERT Violation (most critical bug)

**Error:**
```
new row violates row-level security policy for table "bookmarks"
```

**What happened:**
Every bookmark save was silently rejected by the database. No JavaScript error appeared in the UI — the app looked like it worked, but nothing was persisted.

**Root cause:**
The INSERT payload was `{ title, url }` — missing `user_id`. The RLS policy uses `WITH CHECK (user_id = auth.uid())`. This means Postgres checks the actual row being inserted and verifies that the `user_id` column equals the logged-in user's ID. If `user_id` is absent from the payload, Postgres cannot verify the condition — so it rejects the insert entirely.

This is a subtle distinction: `WITH CHECK` validates the **row being written**, not just whether you are authenticated. Being logged in is not enough — the row itself must carry your identity.

**Fix:**
Added `user_id` to the `BookmarkCreate` TypeScript interface, passed the authenticated user's ID through the hook into the repository, and included it explicitly in the insert:

```typescript
// Before (broken) — missing user_id
await supabase.from('bookmarks').insert([{ title, url }]);

// After (fixed) — user_id from auth session
await supabase.from('bookmarks').insert([{ title, url, user_id }]);
```

**Lesson:** When using Supabase RLS with `WITH CHECK`, you must include every column referenced in the policy in the insert payload. The database enforces privacy — but only if you give it the data to enforce it against.

---

### Problem 2 — Google login redirected to localhost after Vercel deployment

**What happened:**
After deploying to Vercel, clicking "Continue with Google" completed the OAuth flow successfully — the token was issued — but the browser landed on `http://localhost:3000` instead of the live Vercel URL. The access token was visible in the URL bar, but the app wasn't there to receive it.

**Root cause:**
Supabase's **Site URL** was still set to `http://localhost:3000` from local development. After Google completes OAuth, it hands control back to Supabase, which then redirects to the configured Site URL. Since that was still pointing at localhost, users ended up there — even when visiting from the deployed production app.

**Fix:**
No code changes required. Only Supabase dashboard changes:
- Changed **Site URL** to the Vercel URL
- Added the Vercel bookmarks URL to **Redirect URLs**
- Kept the localhost URL in Redirect URLs so local development still worked

**Lesson:** OAuth redirect configuration lives outside the codebase. Deployment checklists must include updating auth redirect URLs in every third-party service — it is easy to miss and impossible to debug from code alone.

---

### Problem 3 — Real-time sync not working between tabs

**What happened:**
Adding a bookmark in Tab 1 did not appear in Tab 2 without a page refresh. The subscription status showed "Connecting…" permanently, or appeared successful but no events ever arrived.

**Root cause — two separate issues found:**

**Issue A (Supabase Dashboard):** The `bookmarks` table was not added to the `supabase_realtime` publication. Supabase only broadcasts WAL (Write-Ahead Log) change events for tables that have been explicitly opted into replication. The subscription code was correct, but Supabase had nothing to broadcast because the table wasn't being watched.

**Fix A:** Supabase → Database → Replication → toggled `bookmarks` ON. This was a one-click dashboard change with no code involved.

**Issue B (Code):** The original subscription used a single `event: '*'` listener for all event types. Splitting into separate `.on()` handlers for `INSERT`, `UPDATE`, and `DELETE` proved significantly more reliable for Supabase's internal event routing:

```typescript
// More reliable than a single event: '*' handler
channel
  .on('postgres_changes', { event: 'INSERT', table: 'bookmarks', filter: `user_id=eq.${userId}` }, handleInsert)
  .on('postgres_changes', { event: 'UPDATE', table: 'bookmarks', filter: `user_id=eq.${userId}` }, handleUpdate)
  .on('postgres_changes', { event: 'DELETE', table: 'bookmarks' }, handleDelete)
  .subscribe()
```

**Note on DELETE filter:** Supabase's DELETE event does not reliably include `user_id` in `payload.old` when a column filter is applied — this depends on the PostgreSQL replica identity setting. Removing the filter from DELETE and matching by ID in the handler is more reliable.

**Lesson:** Real-time features have two independent configuration surfaces — the dashboard (what Supabase watches) and the code (what events you subscribe to). Both must be correct. A working subscription producing zero events usually means the dashboard configuration is missing.

---

### Problem 4 — Optimistic UI ghost entries on insert failure

**What happened:**
When a bookmark insert failed (due to an RLS error during debugging), the optimistic entry remained in the UI permanently. The user saw a bookmark that did not exist in the database, with no way to remove it except refreshing the page.

**Root cause:**
The catch block was calling `Date.now()` again to identify the optimistic entry to remove. Because time had passed since the optimistic entry was created, this produced a different number — the filter matched nothing, so nothing was removed.

```typescript
// Broken — two different Date.now() calls = two different values
const optimistic = { id: Date.now(), ... };  // e.g. 1771495579000
// time passes...
setBookmarks(prev => prev.filter(b => b.id !== Date.now())); // e.g. 1771495579312 — wrong!
```

**Fix:**
Capture the ID once in a `const` before the async operation, and reference the same variable everywhere:

```typescript
const optimisticId = Date.now(); // captured ONCE
const optimistic = { id: optimisticId, ... };

try {
  const saved = await bookmarkRepo.create(data);
  setBookmarks(prev => prev.map(b => b.id === optimisticId ? saved : b)); // replace with real
} catch {
  setBookmarks(prev => prev.filter(b => b.id !== optimisticId)); // revert correctly
}
```

**Lesson:** When using timestamps as temporary IDs in async flows, always capture them in a variable before the async work begins. Never call `Date.now()` twice expecting the same result.

---

### Problem 5 — Multiple Supabase subscriptions per page (N subscriptions for N cards)

**What happened:**
The initial implementation called `useBookmarks(bookmark.user_id)` inside each `BookmarkCard` component. With 10 cards on screen, this created 10 separate Supabase Realtime subscriptions — each with its own WebSocket handler, its own bookmark state, and its own event processing. Events were being processed multiple times, state was out of sync between instances, and the browser was holding far more WebSocket connections than necessary.

**Root cause:**
React hooks create isolated state instances per component. Every `BookmarkCard` calling `useBookmarks()` independently had no shared state with the others. Each one thought it owned the complete bookmark list — and each one was subscribing to the same events independently.

**Fix:**
`BookmarkCard` no longer calls any hooks. It receives `onDelete` as a prop from its parent `BookmarkList`, which is the single owner of the `useBookmarks` instance. The rule applied here: **one subscription per page, owned by the top-level component, passed down via props**.

**Lesson:** Supabase Realtime subscriptions are not cheap. Each channel is a WebSocket connection. Hook instances inside repeated components multiply your connections. Always lift subscriptions to the highest component that needs them and pass data and callbacks downward.

---

### Problem 6 — Search bar and add-bookmark form sharing state

**What happened:**
Typing a search query caused the add-bookmark modal's title field to pre-fill with the search text. Submitting the form cleared the search query. Both inputs were interfering with each other in ways that were confusing to use.

**Root cause:**
The search bar and the form inputs were both reading from and writing to a single shared `searchTerm` state variable. One input had no way of knowing the other existed — they were both just doing `setValue(e.target.value)` to the same state.

**Fix:**
Split into completely independent state variables:
- `searchQuery` — owned exclusively by the search bar
- `formTitle` + `formUrl` — owned exclusively by the modal form

Changes to search never affect the form. Submitting the form never clears the search. Two concerns, two separate states.

**Lesson:** State that serves two different UI purposes should always be two separate variables, even if they seem related. Shared state between conceptually independent inputs is a common source of subtle, hard-to-reproduce bugs.

---

### Problem 7 — User avatar broken for some Google accounts

**What happened:**
With one Google account the avatar displayed correctly. With a different Google account the avatar showed a broken image icon. The inconsistency was account-specific and not reproducible in development.

**Root cause:**
Google's `avatar_url` in OAuth user metadata can expire, return 403 Forbidden, or be restricted for certain account types — particularly Google Workspace accounts and accounts with strict privacy settings. The URL format Google returns is not guaranteed to remain accessible indefinitely.

**Fix:**
Removed all reliance on `avatar_url`. The avatar always renders the user's first initial letter in a coloured circle. The colour is deterministically derived from the character code of the initial — so each user always gets the same colour, but no external image request is ever made:

```typescript
function UserAvatar({ name, email }: { name?: string; email?: string }) {
  const initial = (name?.[0] ?? email?.[0] ?? 'U').toUpperCase();
  const colors = ['#7c6ef7', '#10d986', '#22d3ee', '#f43f72', '#f59e0b'];
  const color = colors[initial.charCodeAt(0) % colors.length];
  // renders a styled div — never an <img> tag
}
```

**Lesson:** Third-party image URLs from OAuth providers are not reliable for production use. Any UI that depends on `avatar_url` from Google should always implement a text-based fallback.

---

### Problem 8 — Vercel not auto-deploying on git push

**What happened:**
After pushing code changes to GitHub, the Vercel deployment did not update. The live app kept serving the previous version regardless of how many times changes were pushed.

**Root cause:**
The Vercel project's **Production Branch** setting was pointing to `main`, but code was being pushed to a differently-named branch. Vercel only triggers auto-deployment when a push arrives on the exact branch it is configured to watch.

**Fix:**
Verified the branch name in `git branch` matched Vercel's Production Branch setting exactly. For immediate relief: Vercel → Deployments → Redeploy on the latest deployment forces an immediate rebuild from the current branch state.

**Lesson:** Always confirm the Vercel Production Branch setting after initial project setup. A mismatch between your local branch name and Vercel's configured branch silently breaks auto-deployment with no error messages.

---

## 💡 Key Architecture Decisions

### Repository Pattern for database access
All database operations for bookmarks live in `BookmarkRepository` in `lib/db.ts`. Components and hooks never call Supabase directly — they go through the repository. This means if the database or ORM ever changes, only one file needs to change. It also makes the business logic easier to test in isolation.

### Server-side middleware for route protection
`middleware.ts` runs on the server before any page renders. Even if a user manually types `/bookmarks` in the URL bar, they are redirected before React loads — not after. Client-side redirects in `useEffect` are a secondary fallback, not the primary security boundary.

### Optimistic UI for perceived performance
Waiting for a server round-trip before showing any feedback makes apps feel slow. With Optimistic UI, the bookmark appears in the list immediately — the database operation happens in the background. If it fails, the entry is cleanly reverted. This is the same pattern used in Gmail, Notion, and most modern productivity apps.

---

## 📋 Scripts

```bash
npm run dev      # Development server at localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint check
```

---

## 🔑 Environment Variables

| Variable | Description | Where to find it |
|----------|-------------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key | Supabase → Settings → API |

Both variables are prefixed `NEXT_PUBLIC_` which makes them available in the browser bundle. The anon key is safe to expose — all data security is enforced by Row Level Security at the PostgreSQL level, not by keeping the key secret.
