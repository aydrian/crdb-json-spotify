import { type LoaderArgs, json, redirect } from "@remix-run/node";
import { useCombobox } from "downshift";
import { useId, useState } from "react";
import { useSpinDelay } from "spin-delay";
import { Client } from "spotify-api.js";
import invariant from "tiny-invariant";

import { Label } from "~/components/ui/label.tsx";
import { useDebounceFetcher } from "~/hooks/debounce-fetcher.tsx";
import {
  DEFAULT_FAILURE_REDIRECT,
  requireUserId,
  spotifyStrategy
} from "~/utils/auth.server.ts";
import { cn } from "~/utils/misc.ts";

export async function loader({ request }: LoaderArgs) {
  await requireUserId(request);

  const spotifySession = await spotifyStrategy.getSession(request);
  if (!spotifySession) {
    throw redirect(DEFAULT_FAILURE_REDIRECT);
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("query");
  invariant(typeof query === "string", "query is required");

  if (query.length < 1) {
    return json({ artists: [] });
  }

  const spotify = new Client({ token: spotifySession.accessToken });

  const artists = await spotify.artists.search(query, {});

  return json({ artists });
}

export function ArtistCombobox({
  className,
  error,
  labelText = "Artist",
  name,
  onChange
}: {
  className?: string;
  error?: null | string;
  labelText?: string;
  name: string;
  onChange?: (artistId: string) => void;
}) {
  const artistFetcher = useDebounceFetcher<typeof loader>();
  const id = useId();
  const artists = artistFetcher.data?.artists ?? [];
  type Artist = (typeof artists)[number];
  const [selectedArtist, setSelectedArtist] = useState<
    Artist | null | undefined
  >(null);

  const cb = useCombobox<Artist>({
    id,
    itemToString: (item) => (item ? item.name : ""),
    items: artists,
    onInputValueChange: (changes) => {
      artistFetcher.debounceSubmit(
        { query: changes.inputValue ?? "" },
        { action: "/resources/artists", debounceTimeout: 60 * 5, method: "GET" }
      );
    },
    onSelectedItemChange: ({ selectedItem }) => {
      setSelectedArtist(selectedItem);
      if (selectedItem && onChange) {
        onChange(selectedItem?.id);
      }
    }
  });

  const busy = artistFetcher.state !== "idle";
  const showSpinner = useSpinDelay(busy, { delay: 150, minDuration: 500 });
  const displayMenu = cb.isOpen && artists.length;

  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <input name={name} type="hidden" value={selectedArtist?.id ?? ""} />
      <Label {...cb.getLabelProps()}>{labelText}</Label>
      <div className="relative grow">
        <div
          className={cn(
            "flex items-center gap-1 rounded-md bg-white p-0.5 shadow-sm",
            displayMenu && "rounded-b-none"
          )}
        >
          <div className="relative grow">
            <input
              className="w-full p-1.5"
              placeholder="Enter an artist name..."
              {...cb.getInputProps()}
            />
            <Spinner showSpinner={showSpinner} />
          </div>
          <button
            aria-label="toggle menu"
            className="px-1.5"
            type="button"
            {...cb.getToggleButtonProps()}
          >
            {displayMenu ? <>&#8593;</> : <>&#8595;</>}
          </button>
        </div>
        <ul
          className={cn(
            "absolute z-10 max-h-80 w-full overflow-scroll rounded-b-md bg-white p-0 shadow-md",
            !displayMenu && "hidden"
          )}
          {...cb.getMenuProps()}
        >
          {displayMenu &&
            artists.map((item, index) => {
              console.log({ images: item.images });
              const artistImage = item.images?.at(-1);
              return (
                <li
                  className={cn(
                    cb.highlightedIndex === index && "bg-green-100",
                    cb.selectedItem === item && "font-bold",
                    "flex gap-1 px-3 py-2 shadow-sm"
                  )}
                  key={item.id}
                  {...cb.getItemProps({ index, item })}
                >
                  {artistImage ? (
                    <img
                      alt={item.name}
                      className={`aspect-square w-12 rounded-sm object-cover shadow-sm`}
                      src={artistImage.url}
                    />
                  ) : (
                    <div className="flex aspect-square w-12 items-center justify-center rounded-sm bg-gray-300 text-center text-sm font-light shadow-sm">
                      No Photo
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm font-light">
                      {item.genres?.join(", ")}
                    </div>
                  </div>
                </li>
              );
            })}
        </ul>
      </div>
      {error ? (
        <em className="text-d-p-xs text-red-600" id="artist-error">
          {error}
        </em>
      ) : null}
    </div>
  );
}

function Spinner({ showSpinner }: { showSpinner: boolean }) {
  return (
    <div
      className={`absolute right-0 top-[6px] transition-opacity ${
        showSpinner ? "opacity-100" : "opacity-0"
      }`}
    >
      <svg
        className="-ml-1 mr-3 h-5 w-5 animate-spin"
        fill="none"
        height="1em"
        viewBox="0 0 24 24"
        width="1em"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-25"
          cx={12}
          cy={12}
          r={10}
          stroke="currentColor"
          strokeWidth={4}
        />
        <path
          className="opacity-75"
          d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
