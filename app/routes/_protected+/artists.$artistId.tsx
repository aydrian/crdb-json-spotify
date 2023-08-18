import type { ActionArgs, LoaderArgs } from "@remix-run/node";

import { conform } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Response, json, redirect } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { Client, type Track } from "spotify-api.js";
import { z } from "zod";

import { AlbumBlank } from "~/components/blanks.tsx";
import { Icon } from "~/components/icon.tsx";
import { Button } from "~/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "~/components/ui/card.tsx";
import {
  DEFAULT_FAILURE_REDIRECT,
  requireUserId,
  spotifyStrategy
} from "~/utils/auth.server.ts";
import { prisma } from "~/utils/db.server.ts";
import { cn } from "~/utils/misc.ts";

const LikeSchema = z.object({ artistId: z.string(), trackId: z.string() });

export async function loader({ params, request }: LoaderArgs) {
  const { artistId } = params;
  if (!artistId) {
    throw new Response("Artist not found.", { status: 404 });
  }
  await requireUserId(request);
  const spotifySession = await spotifyStrategy.getSession(request);
  if (!spotifySession) {
    throw redirect(DEFAULT_FAILURE_REDIRECT);
  }

  const user = await prisma.user.findUnique({
    select: { tracks: { where: { track: { artistId } } } },
    where: { id: String(spotifySession.user?.id) }
  });

  const likes = user?.tracks ?? [];

  const spotify = new Client({ token: spotifySession.accessToken });
  const artist = await spotify.artists.get(artistId);

  if (!artist) {
    throw new Response("Artist not found.", { status: 404 });
  }

  const tracks = await spotify.artists.getTopTracks(artist.id);

  return typedjson({ artist, likes, tracks });
}

export async function action({ request }: ActionArgs) {
  const spotifySession = await spotifyStrategy.getSession(request);
  if (!spotifySession) {
    throw redirect(DEFAULT_FAILURE_REDIRECT);
  }
  const formData = await request.formData();
  const submission = parse(formData, {
    schema: LikeSchema
  });
  if (!submission.value) {
    return json(
      {
        status: "error",
        submission
      } as const,
      { status: 400 }
    );
  }
  const { artistId, trackId } = submission.value;
  const userId = String(spotifySession.user?.id);

  if (submission.intent === "like") {
    const spotify = new Client({ token: spotifySession.accessToken });
    const track = await spotify.tracks.get(trackId);

    await prisma.$transaction([
      prisma.$queryRaw<{ id: string }[]>`UPSERT INTO tracks 
      (artist_id, data) 
      VALUES (${artistId}, ${JSON.stringify(track)})
      RETURNING id;`,
      prisma.tracksForUsers.upsert({
        create: { trackId, userId },
        update: {},
        where: { trackId_userId: { trackId, userId } }
      })
    ]);
  } else if (submission.intent === "unlike") {
    await prisma.tracksForUsers.delete({
      where: { trackId_userId: { trackId, userId } }
    });
  } else {
    return json({
      status: "idle",
      submission
    } as const);
  }

  return json({
    status: "success",
    submission
  } as const);
}

export default function ArtistsArtistId() {
  const { artist, likes, tracks } = useTypedLoaderData<typeof loader>();
  const artistImage = artist.images?.at(0);
  return (
    <div className="flex justify-center gap-4">
      <Card className="overflow-clip shadow-md">
        {artistImage ? (
          <img
            alt={artist.name}
            className={`aspect-square w-[${artistImage.width}px] object-cover`}
            src={artistImage.url}
          />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center bg-gray-300 text-3xl font-light">
            No Photo
          </div>
        )}
        <CardHeader>
          <CardTitle>{artist.name}</CardTitle>
        </CardHeader>
        <CardContent></CardContent>
      </Card>
      <div className="h-full w-full rounded-md bg-[#f5f5f5] p-4 shadow-md">
        <h2 className="text-3xl font-bold">Top Tracks</h2>
        <ul className="flex flex-col gap-1">
          {tracks.map((track) => (
            <TrackListing
              artistId={artist.id}
              isLiked={!!likes.find(({ trackId }) => trackId === track.id)}
              key={track.id}
              track={track}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

export function TrackListing({
  artistId,
  isLiked,
  track
}: {
  artistId: string;
  isLiked?: boolean;
  track: Track;
}) {
  const trackFetcher = useFetcher<typeof action>();
  const albumImage = track.album?.images?.at(-1);
  return (
    <li
      className="flex items-center gap-2 p-1.5 hover:rounded-md hover:bg-green-100 hover:shadow-md"
      key={track.id}
    >
      <trackFetcher.Form method="POST">
        <input name="trackId" type="hidden" value={track.id} />
        <input name="artistId" type="hidden" value={artistId} />
        <Button
          className="group h-6 w-6 bg-transparent p-0 hover:bg-transparent"
          disabled={trackFetcher.state !== "idle"}
          name={conform.INTENT}
          type="submit"
          value={isLiked ? "unlike" : "like"}
        >
          <Icon
            className={cn(
              "aspect-square h-full text-gray-500 group-hover:animate-pulse",
              isLiked
                ? "text-pink-700 group-hover:hidden"
                : "group-hover:text-pink-700",
              trackFetcher.state !== "idle" ? "animate-bounce" : null,
              isLiked && trackFetcher.state !== "idle" ? "hidden" : null
            )}
            name="heart"
          />
          <Icon
            className={cn(
              "hidden aspect-square h-full text-gray-500",
              isLiked ? "group-hover:block group-hover:animate-pulse" : null,
              isLiked && trackFetcher.state !== "idle"
                ? "block animate-bounce"
                : null
            )}
            name="heart-crack"
          />
          <span className="sr-only">Like</span>
        </Button>
      </trackFetcher.Form>
      <div>
        {albumImage ? (
          <img
            alt={track.album?.name}
            className="rounded-sm shadow-sm"
            src={albumImage?.url}
          />
        ) : (
          <AlbumBlank />
        )}
      </div>
      <div className="flex flex-col">
        <div className="font-medium">{track.name}</div>
        {track.album ? (
          <div className="text-sm font-light">{track.album.name}</div>
        ) : null}
      </div>
    </li>
  );
}
