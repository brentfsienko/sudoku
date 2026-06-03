import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Sudogku",
    short_name: "Sudogku",
    description: "A dog-themed multiplayer Sudoku.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#7ec4cf",
    theme_color: "#7ec4cf",
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
