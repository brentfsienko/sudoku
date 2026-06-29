import type { Metadata } from "next";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Sudoku Online — Play in Your Browser",
  description:
    "Play Sudoku online on any device. Sudogku runs in your browser with solo play, five difficulties, notes, hints, and optional multiplayer. Fast, free, and mobile-friendly.",
  path: "/sudoku-online",
  keywords: [
    "sudoku online",
    "play sudoku online",
    "online sudoku game",
    "browser sudoku",
    "web sudoku",
    "mobile sudoku online",
    "sudoku internet",
  ],
});

export default function SudokuOnlinePage() {
  return (
    <SeoLandingPage
      h1="Sudoku online — play anywhere, instantly"
      intro="Sudogku brings classic 9×9 Sudoku to the web with a modern, touch-friendly interface. No app store, no plug-ins — just open the site and play Sudoku online from your phone or computer."
      ctaHref="/play?difficulty=easy"
      ctaLabel="Play Sudoku online"
      related={[
        {
          href: "/free-sudoku",
          label: "Free Sudoku",
          blurb: "Unlimited free puzzles at every difficulty.",
        },
        {
          href: "/multiplayer-sudoku",
          label: "Multiplayer Sudoku",
          blurb: "Real-time games with a shareable room code.",
        },
        {
          href: "/",
          label: "Sudogku home",
          blurb: "Friends, stats, and daily trivia.",
        },
      ]}
      sections={[
        {
          heading: "Built for browsers and mobile",
          paragraphs: [
            "Sudogku is designed for one-thumb play on phones and comfortable solving on larger screens. The number pad, notes toggle, and highlight system stay within easy reach whether you're on the couch or at a desk.",
            "Install as a progressive web app (PWA) for offline-ready launching from your home screen — the closest thing to a dedicated Sudoku app without leaving the browser.",
          ],
        },
        {
          heading: "Solo Sudoku with depth",
          paragraphs: [
            "Start a quick Easy board on your lunch break or grind Expert and Master puzzles when you want a challenge. Resume in-progress games anytime from the Play tab.",
            "Track weekly games, time played, mistakes, and a difficulty climb score on your personal dashboard.",
          ],
        },
        {
          heading: "More than single-player",
          paragraphs: [
            "When you want company, jump into multiplayer Sudoku: co-op on one shared grid or competitive mode where both players race to claim squares. Share a short room code — no account required to try a match.",
          ],
        },
      ]}
    />
  );
}
