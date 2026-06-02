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
- Local stats: streak, all-time best score, best times per difficulty, and a customizable dog profile.

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

## Tech

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- Liveblocks for real-time shared board state and player presence
- Custom backtracking Sudoku generator/solver (guaranteed unique solutions)

## Scripts

| Command         | Description            |
| --------------- | ---------------------- |
| `npm run dev`   | Start dev server       |
| `npm run build` | Production build       |
| `npm run start` | Serve production build |
| `npm run lint`  | Run ESLint             |
