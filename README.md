# Coop Sudoku

Multiplayer sudoku built with [Next.js](https://nextjs.org) and deployed on [Vercel](https://vercel.com).

**Repository:** [github.com/brentfsienko/sudoku](https://github.com/brentfsienko/sudoku)

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Start dev server         |
| `npm run build`| Production build         |
| `npm run start`| Serve production build   |
| `npm run lint` | Run ESLint               |

## Deploy on Vercel

This project is set up for Vercel’s Next.js preset. Pushes to `main` on GitHub trigger production deployments when the repo is connected in the Vercel dashboard.

To link or deploy from the CLI:

```bash
npx vercel link
npx vercel --prod
```

To connect Git for automatic deploys:

```bash
npx vercel git connect
```
