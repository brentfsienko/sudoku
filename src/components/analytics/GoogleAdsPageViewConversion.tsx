import {
  GOOGLE_ADS_PAGE_VIEW_SEND_TO,
  GOOGLE_ADS_PAGE_VIEW_SESSION_KEY,
  isGoogleAdsEnabled,
} from "@/lib/analytics/googleAds";

/**
 * Google Ads "Page view" conversion. Rendered only from `/` so it sits
 * in <head> after <GoogleAdsTag />. sessionStorage keeps Play → Home
 * (and reloads in the same tab) from counting twice.
 */
export function GoogleAdsPageViewConversion() {
  if (!isGoogleAdsEnabled()) return null;

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
(function(){
  try {
    if (sessionStorage.getItem('${GOOGLE_ADS_PAGE_VIEW_SESSION_KEY}') === '1') return;
    sessionStorage.setItem('${GOOGLE_ADS_PAGE_VIEW_SESSION_KEY}', '1');
  } catch (e) {}
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('event', 'conversion', {'send_to': '${GOOGLE_ADS_PAGE_VIEW_SEND_TO}'});
})();
`,
      }}
    />
  );
}
