"use client";

import Script from "next/script";
import { REDDIT_PIXEL_ID, isRedditPixelEnabled } from "@/lib/analytics/reddit";

/**
 * Loads the Reddit Pixel base code and fires PageVisit once per full page load.
 * Conversion events (SignUp, GameStart) are fired from app code via track helpers.
 */
export function RedditPixel() {
  if (!isRedditPixelEnabled()) return null;

  const init = `
!function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js";t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);
rdt('init','${REDDIT_PIXEL_ID}');
rdt('track','PageVisit');
`;

  return (
    <Script id="reddit-pixel" strategy="afterInteractive">
      {init}
    </Script>
  );
}
