import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Sudoku game room",
  description: "Private Sudogku multiplayer Sudoku room.",
  path: "/game",
  noIndex: true,
});

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return children;
}
