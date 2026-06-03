# 🐾 Floof Sudoku

A floofy, dog-themed Sudoku game built with [Next.js](https://nextjs.org) and deployed on [Vercel](https://vercel.com). Play solo, or with a friend over Wi-Fi in **Co-op** or **Competitive** mode.

**Repository:** [github.com/brentfsienko/sudoku](https://github.com/brentfsienko/sudoku)

## Features

- Five difficulties — Easy, Medium, Hard, Expert, Master — with fresh, uniquely-solvable puzzles generated on the fly.
- Three modes:
  - **Single Player** — classic solo solve.
  - **Co-op** — two pups solve one board together, 3-strikes shared.
  - **Competitive** — both play the same board; whoever fills the most squares wins.
- Real-time two-player play via shareable **room codes** (powered by Liveblocks).
- Each player gets their own color; entries appear in that color, wrong entries fill the cell light red.
- Live opponent presence — see who you're playing against, their dog avatar, and their selected cell.
- Full board toolkit: notes, hints, undo, erase, mistake tracker (x/3), timer + pause, live score, and same row/column/box/number highlighting.
- Post-game stats breakdown (time, mistakes, hints, and per-player squares filled).
- A rich **Me** dashboard: separate **Solo** and **Multiplayer** stats, most-played opponent, and a Strava-style **progress graph** (games, time played, mistakes, and a "Climb" difficulty metric) over the past 12 weeks.
- Stats save on-device by default and sync **across devices** when you sign in with email and password (Supabase).

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Enabling multiplayer

Single-player works out of the box. Co-op and Competitive need a free [Liveblocks](https://liveblocks.io/dashboard) account:

1. Create a project in the Liveblocks dashboard and copy the **secret key**.
2. Add it to `.env.local`:

   ```bash
   LIVEBLOCKS_SECRET_KEY=sk_dev_xxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. Add the same variable in your Vercel project settings (Settings → Environment Variables) so production multiplayer works.

### Enabling cross-device stats (Supabase)

Stats work without this — they're stored in the browser's `localStorage`. To let players sign in and sync stats across devices, add a free [Supabase](https://supabase.com) project:

1. Create a project, then open **SQL Editor** and run [`supabase/schema.sql`](./supabase/schema.sql) and [`supabase/friends.sql`](./supabase/friends.sql) (stats storage, searchable profiles, friends, and game invites).
2. From **Project Settings → API Keys**, copy the project URL and the **publishable key**, and add them to `.env.local`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxx
   ```

3. In **Authentication → Providers → Email**, keep email enabled and turn on **Confirm email** only if you want verification on sign-up (otherwise new users can sign in immediately). Password sign-in uses the Email provider's password option (enabled by default).
4. In **Authentication → URL Configuration**, set the **Site URL** to your app's origin (e.g. `http://localhost:3000` for dev and your Vercel URL for prod) and add these to **Redirect URLs**:
   - `http://localhost:3000/auth/reset-password` (dev)
   - `https://your-vercel-domain/auth/reset-password` (prod)
5. Add the same two `NEXT_PUBLIC_*` variables in Vercel (Settings → Environment Variables).

Signed-out players keep stats locally; on first sign-in the device's stats seed the account, after which everything syncs.

## Tech

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- Liveblocks for real-time shared board state and player presence
- Supabase (auth + Postgres) for optional cross-device stats sync
- Custom backtracking Sudoku generator/solver (guaranteed unique solutions)
- Hand-rolled SVG progress chart (no chart dependencies)

## Scripts

| Command         | Description            |
| --------------- | ---------------------- |
| `npm run dev`   | Start dev server       |
| `npm run build` | Production build       |
| `npm run start` | Serve production build |
| `npm run lint`  | Run ESLint             |
