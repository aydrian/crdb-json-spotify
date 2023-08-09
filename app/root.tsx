import type { LinksFunction } from "@remix-run/node";

import { cssBundleHref } from "@remix-run/css-bundle";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration
} from "@remix-run/react";

import iconHref from "~/components/icons/sprite.svg";
import styles from "~/tailwind.css";

export const links: LinksFunction = () => [
  { as: "image", href: iconHref, rel: "preload", type: "image/svg+xml" },
  { href: styles, rel: "stylesheet" },
  ...(cssBundleHref ? [{ href: cssBundleHref, rel: "stylesheet" }] : [])
];

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width,initial-scale=1" name="viewport" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
