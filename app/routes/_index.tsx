import { type LoaderArgs, type V2_MetaFunction, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import {
  Card,
  CardContent,
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
    <main className="container flex min-h-screen items-center justify-center">
      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
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
    </main>
  );
}
