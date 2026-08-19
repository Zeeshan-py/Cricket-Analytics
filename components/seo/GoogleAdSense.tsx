import Script from "next/script";

const adSenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

export function GoogleAdSense() {
  if (!adSenseClientId) return null;

  return (
    <Script
      id="google-adsense"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseClientId}`}
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  );
}
