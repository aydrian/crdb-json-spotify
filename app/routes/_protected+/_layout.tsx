import type { LoaderArgs } from "@remix-run/node";

import { Link, Outlet, useLoaderData } from "@remix-run/react";

import { Icon } from "~/components/icon.tsx";
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "~/components/ui/avatar.tsx";
import { Button } from "~/components/ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from "~/components/ui/dropdown-menu.tsx";
import { requireUserId, spotifyStrategy } from "~/utils/auth.server.ts";

export async function loader({ request }: LoaderArgs) {
  await requireUserId(request);
  return await spotifyStrategy.getSession(request);
}

export default function Layout() {
  const data = useLoaderData<typeof loader>();
  const user = data?.user;
  const [firstName, lastName] = user?.name
    ? user.name.split(" ")
    : ["Spotify", "User"];
  return (
    <div className="flex min-h-screen flex-col gap-4 bg-gradient-to-br from-green-300 from-45% via-blue-500 to-purple-600 p-4">
      <header className="rounded-md bg-[#f5f5f5] p-4 shadow-md">
        <div className="container mx-auto flex flex-col flex-wrap items-center md:flex-row">
          <div className="flex items-center md:w-1/6 md:items-center md:justify-start">
            <Icon className="h-16 w-16" name="cockroach-hd" />
          </div>
          <div className="flex items-center justify-center md:w-4/6">
            <h1 className="w-auto fill-current text-3xl font-bold">
              🎵 CRDB JSON Spotify 🎵
            </h1>
          </div>
          <nav className="ml-5 inline-flex h-full items-center md:ml-0 md:w-1/6 md:justify-end">
            <div className="flex items-center justify-end gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="relative h-8 w-8 rounded-full">
                    <Avatar>
                      <AvatarImage src={user?.image} />
                      <AvatarFallback>{`${firstName.charAt(0)}${lastName.charAt(
                        0
                      )}`}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Icon className="mr-2 h-4 w-4" name="heart" />
                    <Link to="/likes">Liked Tracks</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Icon className="mr-2 h-4 w-4" name="log-out" />
                    <Link to="/logout">Log out</Link>
                    <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </nav>
        </div>
      </header>
      <main className="grow bg-transparent">
        <Outlet />
      </main>
      <footer className="rounded-md bg-black shadow-md">
        <ul className="mx-auto flex max-w-7xl items-center justify-between p-4 text-sm font-bold text-white">
          <li>
            <a
              href={`https://twitter.com/cockroachdb/`}
              rel="noreferrer"
              target="_blank"
            >
              @CockroachDB
            </a>
          </li>
          <li>
            <a
              href="https://github.com/aydrian/crdb-json-spotify"
              rel="noreferrer"
              target="_blank"
            >
              <Icon className="aspect-square h-7 text-white" name="github" />
            </a>
          </li>
        </ul>
      </footer>
    </div>
  );
}
