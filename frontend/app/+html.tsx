import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />

        {/* PWA Meta Tags */}
        <meta name="theme-color" content="#06140D" />
        <meta name="background-color" content="#06140D" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ルーン占い" />
        <meta name="application-name" content="ルーン占い" />
        <meta name="description" content="エルダーフサルク25文字のルーン占い一枚引きアプリ。成り立ちから意味を学べる図鑑付き。" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Icons */}
        <link rel="apple-touch-icon" href="/pwa-icon-192.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/pwa-icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/pwa-icon-512.png" />

        {/* OGP for Social Share */}
        <meta property="og:title" content="ルーン占い - 一枚引き" />
        <meta property="og:description" content="エルダーフサルク25文字のルーン占い。成り立ちから意味を深く学べます。" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/pwa-icon-512.png" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="ルーン占い - 一枚引き" />
        <meta name="twitter:description" content="エルダーフサルク25文字のルーン占い。成り立ちから意味を深く学べます。" />

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: `
          body { 
            margin: 0; 
            background-color: #06140D;
            overscroll-behavior: none;
          }
          #root { display: flex; flex: 1; height: 100vh; }
        `}} />
      </head>
      <body>
        {children}

        {/* Service Worker Registration */}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js')
                .then(function(registration) {
                  console.log('SW registered:', registration.scope);
                })
                .catch(function(error) {
                  console.log('SW registration failed:', error);
                });
            });
          }
        `}} />
      </body>
    </html>
  );
}
