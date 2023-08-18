import { type LoaderArgs, redirect } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import z from "zod";

import { AlbumBlank } from "~/components/blanks.tsx";
import { Button } from "~/components/ui/button.tsx";
import {
  DEFAULT_FAILURE_REDIRECT,
  requireUserId,
  spotifyStrategy
} from "~/utils/auth.server.ts";
import { prisma } from "~/utils/db.server.ts";

const RawQuerySchema = z.array(
  z.object({
    json_agg: z.array(
      z.object({
        album_name: z.string().optional(),
        artists: z.array(z.string()),
        id: z.string(),
        image: z
          .object({
            height: z.number(),
            url: z.string(),
            width: z.number()
          })
          .optional(),
        name: z.string()
      })
    )
  })
);

export async function loader({ request }: LoaderArgs) {
  await requireUserId(request);
  const spotifySession = await spotifyStrategy.getSession(request);
  if (!spotifySession) {
    throw redirect(DEFAULT_FAILURE_REDIRECT);
  }

  const [{ json_agg: likes }] = await prisma.$queryRaw<
    z.infer<typeof RawQuerySchema>
  >`WITH
      json_objects AS (
        SELECT json_build_object(
          'id', "id",
          'name', "data"->>'name',
          'artists', array_agg(artists->>'name'),
          'album_name', "data"->'album'->>'name',
          'image', "data"#>'{album,images,-1}'
        ) j
        FROM tracks
        CROSS JOIN LATERAL jsonb_array_elements(tracks.data->'artists') AS artists
        GROUP BY tracks.id
      )
    SELECT json_agg(j)
    FROM json_objects;`;

  return typedjson({ likes });
}
export default function Likes() {
  const { likes } = useTypedLoaderData<typeof loader>();
  console.log({ likes });
  return (
    <div className="flex h-full w-full flex-col gap-4 rounded-md bg-[#f5f5f5] p-4 shadow-md">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">My Liked Tracks</h2>
        <Button asChild>
          <Link to="/artists">Search by Artist</Link>
        </Button>
      </div>
      {likes ? (
        <ul className="flex flex-col gap-1">
          {likes?.map((track) => {
            return (
              <li
                className="flex items-center gap-2 p-1.5 hover:rounded-md hover:bg-green-100 hover:shadow-md"
                key={track.id}
              >
                <div>
                  {track.image ? (
                    <img
                      alt={track.album_name}
                      className="rounded-sm shadow-sm"
                      src={track.image.url}
                    />
                  ) : (
                    <AlbumBlank />
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="font-semibold">
                    {track.artists.join(", ")}
                  </div>
                  <div className="font-medium">{track.name}</div>
                  {track.album_name ? (
                    <div className="text-sm font-light">{track.album_name}</div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2">
          <div>You haven't liked any tracks</div>
          <Button asChild>
            <Link to="/artists">Search by Artist</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
