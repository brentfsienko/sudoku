import type { Metadata } from "next";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Free Sudoku — Play Online",
  description:
    "Play free Sudoku online at Sudogku. Unlimited puzzles, five difficulty levels from Easy to Master, notes, hints, and undo. No download — start solving in seconds.",
  path: "/free-sudoku",
  keywords: [
    "free sudoku",
    "free sudoku online",
    "play sudoku free",
    "sudoku no download",
    "free sudoku puzzles",
    "sudoku easy",
    "sudoku hard",
    "online sudoku free",
  ],
});

export default function FreeSudokuPage() {
  return (
    <SeoLandingPage
      h1="Free Sudoku online — unlimited puzzles"
      intro="Sudogku is a free Sudoku game you can play instantly in your browser. Every puzzle is freshly generated with a unique solution, so you never run out of boards to solve."
      ctaHref="/play?difficulty=medium"
      ctaLabel="Start free Sudoku"
      related={[
        {
          href: "/sudoku-online",
          label: "Sudoku online",
          blurb: "Optimized for phone, tablet, and desktop browsers.",
        },
        {
          href: "/multiplayer-sudoku",
          label: "Multiplayer Sudoku",
          blurb: "Solve with a friend in co-op or competitive mode.",
        },
        {
          href: "/",
          label: "Sudogku home",
          blurb: "Stats, friends, streaks, and your puzzle history.",
        },
      ]}
      sections={[
        {
          heading: "Why play free Sudoku on Sudogku?",
          paragraphs: [
            "Most Sudoku sites clutter the board with ads or lock harder puzzles behind paywalls. Sudogku keeps the focus on the puzzle: clean grids, fast input, notes, hints when you're stuck, and a mistake counter so you can learn without frustration.",
            "Choose Easy, Medium, Hard, Expert, or Master — each difficulty uses a fresh generator that guarantees exactly one solution, the gold standard for fair Sudoku.",
          ],
        },
        {
          heading: "Features serious solvers expect",
          paragraphs: [
            "Highlight matching numbers and related rows, columns, and boxes. Toggle pencil marks for candidates. Undo mistakes, erase cells, and pause the timer when life interrupts your solve.",
            "Your solo stats and progress charts live on the Me tab. Sign in to sync across devices, or play anonymously with on-device saves.",
          ],
        },
        {
          heading: "No install required",
          paragraphs: [
            "Open Sudogku in Chrome, Safari, Firefox, or Edge and start playing. Add the site to your home screen for a full-screen PWA experience that feels like a native Sudoku app — still 100% free.",
          ],
        },
      ]}
    />
  );
}
