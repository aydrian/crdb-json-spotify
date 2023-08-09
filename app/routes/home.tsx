import type { LoaderArgs } from "@remix-run/node";

import { useLoaderData } from "@remix-run/react";

import { requireUserId, spotifyStrategy } from "~/utils/auth.server.ts";

export async function loader({ request }: LoaderArgs) {
  await requireUserId(request);
  return spotifyStrategy.getSession(request);
}

export default function Home() {
  const data = useLoaderData<typeof loader>();
  return (
    <div>
      <h1>Hello {data?.user?.name}</h1>
    </div>
  );
}
