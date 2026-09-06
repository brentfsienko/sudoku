import { GOOGLE_ADS_ID, isGoogleAdsEnabled } from "@/lib/analytics/googleAds";

/**
 * Google tag for Ads account AW-18431117394.
 * Rendered as raw <head> scripts so Ads / Tag Assistant can see it in page source.
 * Do not add a second copy of this tag.
 */
export function GoogleAdsTag() {
  if (!isGoogleAdsEnabled()) return null;

  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ADS_ID}');
`,
        }}
      />
    </>
  );
}
