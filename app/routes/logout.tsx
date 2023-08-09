import { type LoaderArgs, redirect } from "@remix-run/node";

import { DEFAULT_FAILURE_REDIRECT } from "~/utils/auth.server.ts";
import { destroySession, getSession } from "~/utils/session.server.ts";

export async function loader({ request }: LoaderArgs) {
  return redirect(DEFAULT_FAILURE_REDIRECT, {
    headers: {
      "Set-Cookie": await destroySession(
        await getSession(request.headers.get("cookie"))
      )
    }
  });
}
