import { Suspense, lazy } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import "@fontsource-variable/inter/index.css";
import "./styles/global.css";

// Folds to `null` in production, which leaves the dynamic import unreachable
// and keeps the whole overlay — and its CSS — out of the built bundle.
const FeedbackLayer = import.meta.env.DEV
  ? lazy(() => import("./dev/feedback/FeedbackLayer"))
  : null;

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="icon"
          href="/favicon-light.svg"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="icon"
          href="/favicon-dark.svg"
          media="(prefers-color-scheme: dark)"
        />
        <Meta />
        <Links />
        {import.meta.env.DEV && (
          <script
            dangerouslySetInnerHTML={{
              __html: `if(new URLSearchParams(location.search).has('light'))document.documentElement.dataset.forceLight=''`,
            }}
          />
        )}
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <>
      <Outlet />
      {FeedbackLayer && (
        <Suspense fallback={null}>
          <FeedbackLayer />
        </Suspense>
      )}
    </>
  );
}
