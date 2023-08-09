import type { LoaderArgs } from "@remix-run/node";

import {
  DEFAULT_FAILURE_REDIRECT,
  DEFAULT_SUCCESS_REDIRECT,
  authenticator
} from "~/utils/auth.server.ts";
import { redirectToCookie } from "~/utils/cookies.server.ts";

export async function loader({ request }: LoaderArgs) {
  const redirectTo =
    (await redirectToCookie.parse(request.headers.get("Cookie"))) ??
    DEFAULT_SUCCESS_REDIRECT;

  return authenticator.authenticate("spotify", request, {
    failureRedirect: DEFAULT_FAILURE_REDIRECT,
    successRedirect: redirectTo
  });
}
