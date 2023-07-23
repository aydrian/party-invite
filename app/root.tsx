import { cssBundleHref } from "@remix-run/css-bundle";
import {
  type DataFunctionArgs,
  type LinksFunction,
  type V2_MetaFunction,
  json
} from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData
} from "@remix-run/react";

import { Confetti } from "./components/confetti.tsx";
import styles from "./tailwind.css";
import { getFlashSession } from "./utils/flash-session.server.ts";

export async function loader({ request }: DataFunctionArgs) {
  const { flash, headers: flashHeaders } = await getFlashSession(request);
  return json({ flash }, { headers: flashHeaders });
}

export const meta: V2_MetaFunction<typeof loader> = () => {
  return [{ "og:image": "https://invite.itsaydrian.com/social-preview.png" }];
};

export const links: LinksFunction = () => [
  // Preload CSS as a resource to avoid render blocking
  { as: "style", href: "/fonts/anton/font.css", rel: "preload" },
  { as: "style", href: "/fonts/permanant-marker/font.css", rel: "preload" },
  ...(cssBundleHref
    ? [{ as: "style", href: cssBundleHref, rel: "preload" }]
    : []),
  { href: "/fonts/anton/font.css", rel: "stylesheet" },
  { href: "/fonts/permanant-marker/font.css", rel: "stylesheet" },
  ...(cssBundleHref ? [{ href: cssBundleHref, rel: "stylesheet" }] : []),
  { href: styles, rel: "stylesheet" }
];

export default function App() {
  const data = useLoaderData<typeof loader>();
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width,initial-scale=1" name="viewport" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen w-screen bg-gradient-to-t from-orange-400 to-sky-400 bg-fixed">
        <Outlet />
        <Confetti confetti={data.flash?.confetti} />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
