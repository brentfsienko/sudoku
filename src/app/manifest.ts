import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Floof Sudoku",
    short_name: "Floof",
    description: "A floofy dog-themed multiplayer Sudoku.",
    start_url: "/",
    display: "standalone",
    background_color: "#fdf6ec",
    theme_color: "#fdf6ec",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
