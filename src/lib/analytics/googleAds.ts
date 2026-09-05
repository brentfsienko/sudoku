/**
 * Google Ads tag (gtag.js).
 * Base tag loads via <GoogleAdsTag /> on every page.
 */

export const GOOGLE_ADS_ID =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || "AW-18431117394";

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
