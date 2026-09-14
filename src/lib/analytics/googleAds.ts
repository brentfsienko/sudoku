/**
 * Google Ads tag (gtag.js).
 * Base tag loads via <GoogleAdsTag /> on every page.
 */

export const GOOGLE_ADS_ID =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || "AW-18431117394";

/** Page-view conversion — fire only on the site root. */
export const GOOGLE_ADS_PAGE_VIEW_SEND_TO = "AW-18431117394/Yf62CI-HlPccENKQ0tRE";

/** Session flag so `/` does not convert again on Play → Home. */
export const GOOGLE_ADS_PAGE_VIEW_SESSION_KEY =
  "sudogku-ads-pageview-conversion";

export function isGoogleAdsEnabled(): boolean {
  return GOOGLE_ADS_ID.length > 0;
}

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}
