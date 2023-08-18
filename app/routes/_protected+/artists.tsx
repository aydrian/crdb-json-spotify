import { parse } from "@conform-to/zod";
import {
  type ActionArgs,
  type LoaderArgs,
  json,
  redirect
} from "@remix-run/node";
import { Form, Outlet, useLoaderData, useSubmit } from "@remix-run/react";
import { z } from "zod";

import { Icon } from "~/components/icon.tsx";
import { Button } from "~/components/ui/button.tsx";
import { requireUserId } from "~/utils/auth.server.ts";

import { ArtistCombobox } from "../resources+/artists.tsx";

export const SearchSchema = z.object({
  artistId: z.string({ required_error: "Please enter an artist name" })
});

export async function loader({ params, request }: LoaderArgs) {
  await requireUserId(request);
  const { artistId } = params;

  return json({ artistId });
}

export async function action({ request }: ActionArgs) {
  await requireUserId(request);

  const formData = await request.formData();
  const submission = parse(formData, {
    schema: SearchSchema
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
  if (submission.intent !== "submit") {
    return json({ status: "idle", submission } as const);
  }

  return redirect(`/artists/${submission.value.artistId}`);
}

export default function Artists() {
  const { artistId } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  return (
    <div className="flex flex-col gap-4">
      <Form
        action="/artists"
        className="flex justify-center gap-1"
        method="post"
      >
        <ArtistCombobox
          onChange={(artistId) => {
            submit({ artistId }, { action: "/artists", method: "post" });
          }}
          className="grow"
          labelText="Search for an artist:"
          name="artistId"
        />
        <Button className="px-2">
          <Icon className="mx-auto h-6 w-6" name="search" />
          <span className="sr-only">Search</span>
        </Button>
      </Form>
      {artistId ? (
        <Outlet />
      ) : (
        <div className="flex items-center justify-center text-2xl font-bold">
          No Results
        </div>
      )}
    </div>
  );
}
