import { type ActionArgs, type LoaderArgs, redirect } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";

import { Icon } from "~/components/icon.tsx";
import { SubmitButton } from "~/components/submit-button.tsx";
import {
  DEFAULT_FAILURE_REDIRECT,
  authenticator
} from "~/utils/auth.server.ts";

export async function loader({ request }: LoaderArgs) {
  return redirect(DEFAULT_FAILURE_REDIRECT);
}

export async function action({ request }: ActionArgs) {
  return await authenticator.authenticate("spotify", request);
}

export function SpotifyLoginForm() {
  const spotifyLoginFetcher = useFetcher<typeof action>();

  return (
    <spotifyLoginFetcher.Form action="/auth/spotify" method="POST">
      <SubmitButton
        className="h-auto w-auto rounded-full bg-brand-spotify px-4 py-2 text-base font-light text-white  duration-300 hover:bg-brand-spotify/90 disabled:bg-brand-spotify/50"
        state={spotifyLoginFetcher.state}
      >
        <Icon className="mr-2 h-8 w-8 text-white" name="spotify" /> Login in
        with Spotify
      </SubmitButton>
    </spotifyLoginFetcher.Form>
  );
}
