import { parse } from "@conform-to/zod";
import {
  type ActionArgs,
  type LoaderArgs,
  json,
  redirect
} from "@remix-run/node";
import { Link } from "@remix-run/react";
import { useFetcher } from "react-router-dom";
import { Client } from "spotify-api.js";
import { z } from "zod";

import { Icon } from "~/components/icon.tsx";
import { SubmitButton } from "~/components/submit-button.tsx";
import { Button } from "~/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "~/components/ui/card.tsx";
import { Input } from "~/components/ui/input.tsx";
import { Label } from "~/components/ui/label.tsx";
import {
  DEFAULT_FAILURE_REDIRECT,
  requireUserId,
  spotifyStrategy
} from "~/utils/auth.server.ts";

export const SearchSchema = z.object({
  query: z.string().min(1, "Please enter an artist name")
});

export async function loader({ request }: LoaderArgs) {
  return await requireUserId(request);
}

export async function action({ request }: ActionArgs) {
  await requireUserId(request);

  const spotifySession = await spotifyStrategy.getSession(request);
  if (!spotifySession) {
    throw redirect(DEFAULT_FAILURE_REDIRECT);
  }

  const formData = await request.formData();
  const submission = parse(formData, {
    acceptMultipleErrors: () => true,
    schema: SearchSchema
  });
  if (!submission.value) {
    return json(
      {
        results: null,
        status: "error",
        submission
      } as const,
      { status: 400 }
    );
  }
  if (submission.intent !== "submit") {
    return json({ results: null, status: "idle", submission } as const);
  }
  const { query } = submission.value;
  const spotify = new Client({ token: spotifySession.accessToken });

  const results = await spotify.artists.search(query, { limit: 3 });

  return json({ results, status: "success", submission } as const);
}

export default function Home() {
  const searchFetcher = useFetcher<typeof action>();
  return (
    <div className="flex flex-col gap-4 px-4">
      <searchFetcher.Form method="POST">
        <Label htmlFor="query">Search for an artist:</Label>
        <div className="flex gap-1.5">
          <Input
            id="query"
            name="query"
            placeholder="Enter an artist name..."
          />
          <SubmitButton className="px-2" state={searchFetcher.state}>
            <Icon className="mx-auto h-6 w-6" name="search" />
            <span className="sr-only">Search</span>
          </SubmitButton>
        </div>
      </searchFetcher.Form>
      {searchFetcher.data?.status === "success" ? (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardContent className="flex flex-wrap justify-start gap-4 px-0">
              {searchFetcher.data.results.map((result) => (
                <Card className="max-w-xs overflow-clip" key={result.id}>
                  {result.images.length > 0 ? (
                    <img
                      alt={result.name}
                      className="aspect-square w-[320px] object-cover"
                      src={result.images[1].url}
                    />
                  ) : (
                    <div className="flex aspect-square w-[320px] items-center justify-center bg-gray-300 text-3xl font-light">
                      No Photo
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{result.name}</CardTitle>
                  </CardHeader>
                  <CardFooter>
                    <Button asChild>
                      <Link to={`/artists/${result.id}`}>Choose</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </CardContent>
          </CardHeader>
        </Card>
      ) : null}
    </div>
  );
}
