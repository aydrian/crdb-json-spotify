import { type LoaderArgs, redirect } from "@remix-run/node";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { type Track } from "spotify-api.js";

import { AlbumBlank } from "~/components/blanks.tsx";
import {
  DEFAULT_FAILURE_REDIRECT,
  requireUserId,
  spotifyStrategy
} from "~/utils/auth.server.ts";
import { prisma } from "~/utils/db.server.ts";

export async function loader({ request }: LoaderArgs) {
  await requireUserId(request);
  const spotifySession = await spotifyStrategy.getSession(request);
  if (!spotifySession) {
    throw redirect(DEFAULT_FAILURE_REDIRECT);
  }

  const user = await prisma.user.findUnique({
    select: { tracks: { select: { track: true, trackId: true } } },
    where: { id: String(spotifySession.user?.id) }
  });

  const likes = user?.tracks ?? [];

  return typedjson({ likes });
}
export default function Likes() {
  const { likes } = useTypedLoaderData<typeof loader>();
  return (
    <div className="h-full w-full rounded-md bg-[#f5f5f5] p-4 shadow-md">
      <h2 className="text-3xl font-bold">My Liked Tracks</h2>
      <ul className="flex flex-col gap-1">
        {likes.map(({ track }) => {
          const data = track.data as unknown as Track;
          const albumImage = data?.album?.images?.at(-1);
          return (
            <li
              className="flex items-center gap-2 p-1.5 hover:rounded-md hover:bg-green-100 hover:shadow-md"
              key={track.id}
            >
              <div>
                {albumImage ? (
                  <img
                    alt={data.album?.name}
                    className="rounded-sm shadow-sm"
                    src={albumImage?.url}
                  />
                ) : (
                  <AlbumBlank />
                )}
              </div>
              <div className="flex flex-col">
                <div className="font-semibold">{data.artists[0].name}</div>
                <div className="font-medium">{data.name}</div>
                {data.album ? (
                  <div className="text-sm font-light">{data.album.name}</div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
