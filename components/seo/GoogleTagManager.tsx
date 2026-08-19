import Script from "next/script";

const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

export function GoogleTagManager() {
  if (!gtmId) return null;

  return (
    <Script id="google-tag-manager" strategy="afterInteractive">
      {`
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          'gtm.start': new Date().getTime(),
          event: 'gtm.js'
        });
        (function() {
          var firstScript = document.getElementsByTagName('script')[0];
          var tagManagerScript = document.createElement('script');
          tagManagerScript.async = true;
          tagManagerScript.src = 'https://www.googletagmanager.com/gtm.js?id=${gtmId}';
          firstScript.parentNode.insertBefore(tagManagerScript, firstScript);
        })();
      `}
    </Script>
  );
}

export function GoogleTagManagerNoScript() {
  if (!gtmId) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        title="Google Tag Manager"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}
