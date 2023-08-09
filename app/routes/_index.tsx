import { type LoaderArgs, type V2_MetaFunction, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { Icon } from "~/components/icon.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "~/components/ui/card.tsx";
import {
  DEFAULT_SUCCESS_REDIRECT,
  authenticator
} from "~/utils/auth.server.ts";
import { redirectToCookie } from "~/utils/cookies.server.ts";
import { commitSession, getSession } from "~/utils/session.server.ts";

import { SpotifyLoginForm } from "./auth+/spotify+/_index.tsx";

export const meta: V2_MetaFunction = () => {
  return [
    { title: "CockroachDB JSON Spotify" },
    {
      content:
        "An app using the Spotify API to demonstrate CockroachDB JSON Support",
      name: "description"
    }
  ];
};

export async function loader({ request }: LoaderArgs) {
  await authenticator.isAuthenticated(request, {
    successRedirect: DEFAULT_SUCCESS_REDIRECT
  });

  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirectTo");
  const loginMessage = url.searchParams.get("loginMessage");

  let headers = new Headers();
  if (redirectTo) {
    headers.append("Set-Cookie", await redirectToCookie.serialize(redirectTo));
  }
  const session = await getSession(request.headers.get("cookie"));
  const error = session.get(authenticator.sessionErrorKey);
  let errorMessage: null | string = null;
  if (typeof error?.message === "string") {
    errorMessage = error.message;
  }
  headers.append("Set-Cookie", await commitSession(session));

  return json({ formError: errorMessage, loginMessage }, { headers });
}

export default function Index() {
  const data = useLoaderData<typeof loader>();
  return (
    <main className="flex h-screen flex-col justify-evenly bg-[#f5f5f5] md:flex-row">
      <div className="flex basis-1/4 flex-col items-center justify-center gap-2 md:basis-1/2">
        <h1>CRDB JSON Spotify</h1>
      </div>
      <div className="flex basis-3/4 items-start justify-center bg-gradient-to-br from-green-300 from-45% via-blue-500 to-purple-600  pt-12 md:basis-1/2 md:items-center md:pt-0">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Please log in using your Spotify account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.loginMessage ? (
              <div className="text-sm text-red-600">{data.loginMessage}</div>
            ) : null}
            {data.formError ? (
              <div className="text-sm text-red-600">{data.formError}</div>
            ) : null}
            <SpotifyLoginForm />
          </CardContent>
        </Card>
      </div>
      <a
        className="absolute bottom-4 right-4"
        href="https://github.com/aydrian/"
        rel="noreferrer"
        target="_blank"
      >
        <Icon className="h-8 w-8" name="github" />
        <span className="sr-only">CRDB JSON Spotify GitHub Repository</span>
      </a>
    </main>
  );
}
