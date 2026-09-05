import Script from "next/script";
import { GOOGLE_ADS_ID, isGoogleAdsEnabled } from "@/lib/analytics/googleAds";

/** Google tag for Ads account AW-18431117394. One tag per page, via the root layout. */
export function GoogleAdsTag() {
  if (!isGoogleAdsEnabled()) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-ads" strategy="afterInteractive">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ADS_ID}');
`}
      </Script>
    </>
  );
}
