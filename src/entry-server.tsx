// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en" class="antialiased">
        <head>
          <title>Doug Rabinsmith</title>
          <meta name="description" content="Awesome manager, software engineer, and friend." />
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />

          {/* Critical font styles to prevent FOUF */}
          <style>
            {`
              @font-face {
                font-family: 'Playwrite AU TAS';
                src: url('/fonts/Playwrite_AU_TAS/PlaywriteAUTAS-VariableFont_wght.ttf') format('truetype');
                font-weight: 100 400;
                font-style: normal;
                font-display: swap;
              }
              
              /* Pre-load the font by applying it to a hidden element */
              .font-preloader {
                position: absolute;
                top: -9999px;
                left: -9999px;
                width: 0;
                height: 0;
                overflow: hidden;
                visibility: hidden;
                opacity: 0;
                pointer-events: none;
                font-family: 'Playwrite AU TAS', serif;
              }
            `}
          </style>

          {/* Preload fonts to prevent Flash of Unstyled Font (FOUF) */}
          <link
            rel="preload"
            href="/fonts/Playwrite_AU_TAS/PlaywriteAUTAS-VariableFont_wght.ttf"
            as="font"
            type="font/ttf"
            crossorigin="anonymous"
          />
          <link
            rel="preload"
            href="/fonts/IBM_Plex_Mono/IBMPlexMono-Regular.ttf"
            as="font"
            type="font/ttf"
            crossorigin="anonymous"
          />
          <link
            rel="preload"
            href="/fonts/IBM_Plex_Mono/IBMPlexMono-Bold.ttf"
            as="font"
            type="font/ttf"
            crossorigin="anonymous"
          />
          <link
            rel="preload"
            href="/fonts/IBM_Plex_Mono/IBMPlexMono-Italic.ttf"
            as="font"
            type="font/ttf"
            crossorigin="anonymous"
          />
          <link
            rel="preload"
            href="/fonts/IBM_Plex_Mono/IBMPlexMono-BoldItalic.ttf"
            as="font"
            type="font/ttf"
            crossorigin="anonymous"
          />
          <link rel="preload" href="/fonts/Lato/Lato-Regular.ttf" as="font" type="font/ttf" crossorigin="anonymous" />
          <link rel="preload" href="/fonts/Lato/Lato-Bold.ttf" as="font" type="font/ttf" crossorigin="anonymous" />
          <link
            rel="icon"
            href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🦖</text></svg>"
          />
          <link rel="apple-touch-icon" sizes="57x57" href="/apple-icon-57x57.png" />
          <link rel="apple-touch-icon" sizes="60x60" href="/apple-icon-60x60.png" />
          <link rel="apple-touch-icon" sizes="72x72" href="/apple-icon-72x72.png" />
          <link rel="apple-touch-icon" sizes="76x76" href="/apple-icon-76x76.png" />
          <link rel="apple-touch-icon" sizes="114x114" href="/apple-icon-114x114.png" />
          <link rel="apple-touch-icon" sizes="120x120" href="/apple-icon-120x120.png" />
          <link rel="apple-touch-icon" sizes="144x144" href="/apple-icon-144x144.png" />
          <link rel="apple-touch-icon" sizes="152x152" href="/apple-icon-152x152.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png" />
          <link rel="icon" type="image/png" sizes="192x192" href="/android-icon-192x192.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="manifest" href="/manifest.json" />
          <meta name="msapplication-TileColor" content="#ffffff" />
          <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
          <meta name="theme-color" content="#ffffff" />
          {assets}
        </head>
        <body>
          <div id="app">{children}</div>
          {/* Hidden element to ensure font is loaded */}
          <div class="font-preloader" aria-hidden="true">
            Playwrite
          </div>
          {scripts}
        </body>
      </html>
    )}
  />
));
