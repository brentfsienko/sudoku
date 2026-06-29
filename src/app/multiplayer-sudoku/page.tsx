import type { Metadata } from "next";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Multiplayer Sudoku — Play with Friends",
  description:
    "Play multiplayer Sudoku online with friends. Sudogku offers real-time co-op and competitive modes, shareable room codes, and live presence — free in your browser.",
  path: "/multiplayer-sudoku",
  keywords: [
    "multiplayer sudoku",
    "sudoku with friends",
    "online sudoku multiplayer",
    "two player sudoku",
    "co-op sudoku",
    "competitive sudoku",
    "sudoku room code",
    "play sudoku together",
  ],
});

export default function MultiplayerSudokuPage() {
  return (
    <SeoLandingPage
      h1="Multiplayer Sudoku — co-op and competitive"
      intro="Sudogku is one of the few places to play real-time multiplayer Sudoku online. Send a friend a room code, pick a difficulty, and solve together — or battle to fill the most cells before the puzzle is complete."
      ctaHref="/"
      ctaLabel="Start multiplayer game"
      related={[
        {
          href: "/free-sudoku",
          label: "Free Sudoku",
          blurb: "Warm up with solo puzzles first.",
        },
        {
          href: "/sudoku-online",
          label: "Sudoku online",
          blurb: "Play in the browser on any device.",
        },
        {
          href: "/",
          label: "Sudogku home",
          blurb: "Create a room from the Play tab.",
        },
      ]}
      sections={[
        {
          heading: "Co-op Sudoku — one puzzle, two players",
          paragraphs: [
            "In co-op mode you and a friend share a single Sudoku board. See each other's cursor, dog avatar, and colored entries in real time. You share a three-strike mistake limit, so communication and careful notes pay off.",
            "Co-op is perfect for couples, classmates, or anyone who wants to solve a hard puzzle as a team without passing a paper back and forth.",
          ],
        },
        {
          heading: "Competitive Sudoku — race for squares",
          paragraphs: [
            "Competitive mode gives both players the same starting grid. Every correct number you place counts toward your score. When the puzzle is solved, whoever filled more cells wins — ties happen, and rematches are one tap away.",
            "Live opponent presence shows who's active on the board, making online Sudoku feel social instead of solitary.",
          ],
        },
        {
          heading: "How to start a multiplayer game",
          paragraphs: [
            "Open Sudogku, go to Play, choose Multiplayer, and create a room. Share the code via text or link. Your friend joins from any device with a browser — no download required.",
            "Multiplayer uses real-time sync so moves appear instantly. Stats from co-op and competitive games feed into separate win/loss records on your profile.",
          ],
        },
      ]}
    />
  );
}
