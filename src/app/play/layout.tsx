import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Play Sudoku",
  description:
    "Start a Sudoku puzzle now — pick Easy, Medium, Hard, Expert, or Master. Notes, hints, undo, and timer included. Free online Sudoku at Sudogku.",
  path: "/play",
  keywords: [
    "play sudoku",
    "sudoku game",
    "start sudoku",
    "sudoku puzzle online",
  ],
});

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
