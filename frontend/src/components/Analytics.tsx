'use client';

/**
 * Analytics bootstrap — Google Analytics 4 + Microsoft Clarity.
 *
 * Both load `afterInteractive` (deferred until the page is interactive)
 * so they never block Largest Contentful Paint. Both are no-ops in
 * development (env vars unset) so local dev doesn't pollute prod data.
 *
 * IDs are NEXT_PUBLIC_* so they're baked into the static export at
 * build time, not requested at runtime.
 */

import Script from 'next/script';

export function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;

  if (!gaId && !clarityId) return null;

  return (
    <>
      {gaId && (
        <>
          <Script
            async
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${gaId}', { send_page_view: true });
            `}
          </Script>
        </>
      )}
      {clarityId && (
        <Script
          id="clarity"
          strategy="afterInteractive"
          onError={(e) => console.warn('[Analytics] Clarity blocked:', e)}
        >
          {`try{(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;t.onerror=function(){};y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","${clarityId}");}catch(e){}`}
        </Script>
      )}
    </>
  );
}
