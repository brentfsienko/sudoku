import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Baloo_2, Lora, Nunito } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { JsonLd } from "@/components/seo/JsonLd";
import { ViewportHeightSync } from "@/components/layout/ViewportHeightSync";
import {
  ROOT_METADATA,
  organizationJsonLd,
  webApplicationJsonLd,
} from "@/lib/seo";
import "./globals.css";

const baloo = Baloo_2({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const nunito = Nunito({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const lora = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

/** Self-hosted typewriter face — avoids Google Fonts fetch during Vercel builds. */
const specialElite = localFont({
  src: "./fonts/SpecialElite-Regular.woff2",
  variable: "--font-typewriter",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = ROOT_METADATA;

export const viewport: Viewport = {
  themeColor: "#7ec4cf",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${baloo.variable} ${nunito.variable} ${lora.variable} ${specialElite.variable} h-full antialiased`}
    >
      <body className="flex min-h-0 flex-col overflow-hidden md:h-dvh md:max-h-dvh max-md:h-[var(--app-height,100dvh)] max-md:max-h-[var(--app-height,100dvh)]">
        <JsonLd data={[webApplicationJsonLd(), organizationJsonLd()]} />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var d=document.documentElement,s=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone;if(s){d.classList.add('ios-standalone');}else{d.style.setProperty('--app-height',Math.max(window.innerHeight,document.documentElement.clientHeight)+'px');}})();",
          }}
        />
        <ViewportHeightSync />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
