import type { Metadata } from "next";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "What is Sudogku?",
  description:
    "Sudogku is a free, dog-themed Sudoku game. The name is Sudoku plus dog, spelled Sudogku on purpose. Play solo, daily, or multiplayer in your browser.",
  path: "/about",
  keywords: [
    "sudogku",
    "what is sudogku",
    "sudogku sudoku",
    "sudogku game",
    "dog sudoku",
    "sudogku meaning",
  ],
});

export default function AboutSudogkuPage() {
  return (
    <SeoLandingPage
      h1="Sudogku is a dog-themed Sudoku game"
      intro="Sudogku is the name of this game. It is Sudoku plus dog, spelled S-u-d-o-g-k-u on purpose. If you searched Sudogku and landed here, you have the right place."
      ctaHref="/play?difficulty=medium"
      ctaLabel="Play Sudogku"
      related={[
        {
          href: "/free-sudoku",
          label: "Free Sudoku",
          blurb: "Unlimited puzzles, five difficulties, no paywall.",
        },
        {
          href: "/sudoku-online",
          label: "Sudoku online",
          blurb: "Play in the browser on phone or desktop.",
        },
        {
          href: "/multiplayer-sudoku",
          label: "Multiplayer Sudoku",
          blurb: "Share a room code and solve with a friend.",
        },
      ]}
      sections={[
        {
          heading: "Why it is spelled Sudogku",
          paragraphs: [
            "Sudoku is the puzzle. The dog is the mascot. Sudogku is the brand. That extra g is not a typo. It is how you find this game instead of a generic Sudoku board.",
            "Say it like soo-DOG-koo. Search for Sudogku, or sudogku.com, when you want this site back.",
          ],
        },
        {
          heading: "What you can play",
          paragraphs: [
            "Classic 9 by 9 Sudoku with Easy, Medium, Hard, Expert, and Master boards. Every puzzle has one solution. Notes, hints, undo, and a mistake counter stay on the board.",
            "There is a daily puzzle, plus real-time co-op and competitive rooms you can open with a code. Sign in if you want your pup profile, friends, and stats to follow you across devices.",
          ],
        },
        {
          heading: "Who it is for",
          paragraphs: [
            "Sudogku is for people who want a clean Sudoku game that also feels like a small world of its own. It runs in the browser, installs as a PWA, and does not lock harder puzzles behind a paywall.",
          ],
        },
      ]}
    />
  );
}
