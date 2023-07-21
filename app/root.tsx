import { cssBundleHref } from "@remix-run/css-bundle";
import {
  type DataFunctionArgs,
  type LinksFunction,
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

export const links: LinksFunction = () => [
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
      <body className="min-h-screen w-screen bg-gradient-to-t from-orange-400 to-sky-400">
        <Outlet />
        <Confetti confetti={data.flash?.confetti} />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
