import type { Metadata } from "next";
import { APP_NAME } from "@/lib/brand";
import { getSiteUrl } from "@/lib/site";

export const SITE_NAME = APP_NAME;

/** Primary value prop — used in titles, OG, and JSON-LD. */
export const SITE_TAGLINE =
  "Free online Sudoku — play solo or multiplayer with friends";

export const DEFAULT_DESCRIPTION =
  "Play free Sudoku online at Sudogku — a fast, dog-themed Sudoku puzzle game. " +
  "Five difficulty levels, notes, hints, and undo. Play solo or challenge a friend " +
  "in real-time co-op and competitive multiplayer. No download required — works in your browser and as a PWA.";

/** High-intent search phrases — surfaced in metadata and landing copy. */
export const SEO_KEYWORDS = [
  "sudoku",
  "sudoku online",
  "free sudoku",
  "play sudoku online",
  "free sudoku online",
  "multiplayer sudoku",
  "sudoku with friends",
  "online sudoku game",
  "sudoku puzzle",
  "sudoku no download",
  "co-op sudoku",
  "competitive sudoku",
  "sudoku easy medium hard",
  "sudoku notes hints",
  "sudogku",
  "dog sudoku",
  "browser sudoku",
  "mobile sudoku",
  "daily sudoku",
  "sudoku PWA",
] as const;

export const SEO_ROUTES = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/free-sudoku", changeFrequency: "monthly" as const, priority: 0.95 },
  { path: "/sudoku-online", changeFrequency: "monthly" as const, priority: 0.95 },
  {
    path: "/multiplayer-sudoku",
    changeFrequency: "monthly" as const,
    priority: 0.95,
  },
  { path: "/play", changeFrequency: "weekly" as const, priority: 0.9 },
] as const;

export type SeoPageOptions = {
  title?: string;
  description?: string;
  path?: string;
  keywords?: readonly string[];
  noIndex?: boolean;
};

export function absoluteUrl(path = ""): string {
  const base = getSiteUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, base).toString();
}

/** Full page title: "Free Sudoku Online | Sudogku" */
export function pageTitle(shortTitle?: string): string {
  if (!shortTitle) return `${SITE_NAME} — ${SITE_TAGLINE}`;
  return `${shortTitle} | ${SITE_NAME}`;
}

export function buildPageMetadata(options: SeoPageOptions = {}): Metadata {
  const {
    title,
    description = DEFAULT_DESCRIPTION,
    path = "",
    keywords = SEO_KEYWORDS,
    noIndex = false,
  } = options;

  const canonical = absoluteUrl(path);
  const fullTitle = pageTitle(title);

  return {
    title: fullTitle,
    description,
    keywords: [...keywords],
    applicationName: SITE_NAME,
    alternates: {
      canonical,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: canonical,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
    category: "games",
  };
}

export const ROOT_METADATA: Metadata = {
  ...buildPageMetadata(),
  title: {
    default: pageTitle(),
    template: `%s | ${SITE_NAME}`,
  },
  authors: [{ name: SITE_NAME, url: absoluteUrl() }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  metadataBase: getSiteUrl(),
  icons: {
    icon: [{ url: "/dogs/golden.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/dogs/golden.png", type: "image/png", sizes: "512x512" }],
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export function webApplicationJsonLd() {
  const url = absoluteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    alternateName: ["Sudogku Sudoku", "Free Sudoku Online", "Multiplayer Sudoku"],
    url,
    description: DEFAULT_DESCRIPTION,
    applicationCategory: "GameApplication",
    operatingSystem: "Web, iOS, Android",
    browserRequirements: "Requires JavaScript",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Free online Sudoku puzzles",
      "Five difficulty levels",
      "Solo and multiplayer modes",
      "Real-time co-op and competitive play",
      "Notes, hints, undo, and mistake tracking",
      "Cross-device stats sync with sign-in",
      "Installable PWA",
    ],
    inLanguage: "en",
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: absoluteUrl(),
    logo: absoluteUrl("/dogs/golden.png"),
    sameAs: [],
  };
}

export function faqJsonLd(
  items: ReadonlyArray<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export const LANDING_FAQ = [
  {
    question: "Is Sudogku free to play?",
    answer:
      "Yes. Sudogku is completely free — play unlimited Sudoku puzzles online in your browser with no download or subscription required.",
  },
  {
    question: "Can I play Sudoku with a friend online?",
    answer:
      "Yes. Sudogku supports real-time multiplayer Sudoku. Share a room code to play co-op on one puzzle together or compete to fill the most squares.",
  },
  {
    question: "What Sudoku difficulty levels are available?",
    answer:
      "Sudogku offers Easy, Medium, Hard, Expert, and Master puzzles. Each board is freshly generated with a unique solution.",
  },
  {
    question: "Does Sudogku work on mobile?",
    answer:
      "Yes. Sudogku is built for phones and tablets. You can also add it to your home screen as a PWA for an app-like experience.",
  },
] as const;
