import Link from "next/link";
import { LANDING_FAQ, SITE_NAME, absoluteUrl, faqJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

type Section = {
  heading: string;
  paragraphs: string[];
};

type RelatedLink = {
  href: string;
  label: string;
  blurb: string;
};

type Props = {
  h1: string;
  intro: string;
  sections: Section[];
  ctaLabel?: string;
  ctaHref?: string;
  related?: RelatedLink[];
};

export function SeoLandingPage({
  h1,
  intro,
  sections,
  ctaLabel = "Play free Sudoku now",
  ctaHref = "/play?difficulty=medium",
  related = [],
}: Props) {
  const relatedDefaults: RelatedLink[] = [
    {
      href: "/about",
      label: "What is Sudogku?",
      blurb: "Why it is spelled that way, and what makes the game different.",
    },
    {
      href: "/free-sudoku",
      label: "Free Sudoku",
      blurb: "Unlimited puzzles, five difficulties, no sign-up required.",
    },
    {
      href: "/sudoku-online",
      label: "Sudoku online",
      blurb: "Play in your browser on phone, tablet, or desktop.",
    },
    {
      href: "/multiplayer-sudoku",
      label: "Multiplayer Sudoku",
      blurb: "Co-op and competitive modes with friends.",
    },
  ];

  const links = related.length > 0 ? related : relatedDefaults;

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-[var(--background)] text-[var(--foreground)]">
      <JsonLd data={faqJsonLd(LANDING_FAQ)} />
      <header className="border-b border-[var(--border)] bg-[var(--accent)] px-4 py-6 text-white">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/Sudogku_Orange.svg"
            alt={SITE_NAME}
            className="h-10 w-auto"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <article>
          <h1 className="font-serif-title text-[2rem] leading-tight text-[var(--foreground)]">
            {h1}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[var(--muted)]">{intro}</p>

          <div className="mt-8">
            <Link
              href={ctaHref}
              className="inline-flex items-center justify-center rounded-md bg-[var(--accent)] px-6 py-3 text-base font-bold text-white shadow-sm transition hover:brightness-105"
            >
              {ctaLabel}
            </Link>
          </div>

          {sections.map((section) => (
            <section key={section.heading} className="mt-10">
              <h2 className="font-serif-title text-xl text-[var(--foreground)]">
                {section.heading}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 48)}
                  className="mt-3 text-sm leading-relaxed text-[var(--muted)]"
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}

          <section className="mt-12">
            <h2 className="font-serif-title text-xl text-[var(--foreground)]">
              Frequently asked questions
            </h2>
            <dl className="mt-4 space-y-5">
              {LANDING_FAQ.map((item) => (
                <div key={item.question}>
                  <dt className="font-semibold text-[var(--foreground)]">
                    {item.question}
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                    {item.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-12">
            <h2 className="font-serif-title text-xl text-[var(--foreground)]">
              More ways to play
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block rounded-md border border-[var(--border)] bg-white/60 p-4 transition hover:border-[var(--accent)]"
                  >
                    <span className="font-semibold text-[var(--foreground)]">
                      {link.label}
                    </span>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
                      {link.blurb}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </article>
      </main>

      <footer className="border-t border-[var(--border)] px-4 py-6 text-center text-xs text-[var(--muted)]">
        <Link href="/" className="font-semibold text-[var(--foreground)] hover:underline">
          {SITE_NAME}
        </Link>
        <span className="mx-2">·</span>
        <Link href="/about" className="hover:underline">
          About Sudogku
        </Link>
        <span className="mx-2">·</span>
        <Link href="/play" className="hover:underline">
          Play Sudoku
        </Link>
        <p className="mt-2">{absoluteUrl()}</p>
      </footer>
    </div>
  );
}
