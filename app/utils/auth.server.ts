import { Authenticator } from "remix-auth";
import { type Session, SpotifyStrategy } from "remix-auth-spotify";

import { prisma } from "~/utils/db.server.ts";
import { sessionStorage } from "~/utils/session.server.ts";

import env from "./env.server.ts";

export const DEFAULT_FAILURE_REDIRECT = "/";
export const DEFAULT_SUCCESS_REDIRECT = "/likes";

const scopes = ["user-read-email"].join(" ");
export const spotifyStrategy = new SpotifyStrategy(
  {
    callbackURL: env.SPOTIFY_CALLBACK_URL,
    clientID: env.SPOTIFY_CLIENT_ID,
    clientSecret: env.SPOTIFY_CLIENT_SECRET,
    scope: scopes,
    sessionStorage
  },
  async ({ accessToken, extraParams, profile, refreshToken }) => {
    // Upsert user to database
    await prisma.user.upsert({
      create: {
        email: profile.emails[0].value,
        id: profile.id,
        name: profile.displayName
      },
      update: {
        email: profile.emails[0].value,
        name: profile.displayName
      },
      where: { id: profile.id }
    });
    return {
      accessToken,
      expiresAt: Date.now() + extraParams.expiresIn * 1000,
      refreshToken,
      tokenType: extraParams.tokenType,
      user: {
        email: profile.emails[0].value,
        id: profile.id,
        image: profile.__json.images?.[0]?.url,
        name: profile.displayName
      }
    };
  }
);

// Create an instance of the authenticator, pass a generic with what
// strategies will return and will store in the session
export const authenticator = new Authenticator<Session>(sessionStorage, {
  sessionErrorKey: spotifyStrategy.sessionErrorKey,
  sessionKey: spotifyStrategy.sessionKey
});

authenticator.use(spotifyStrategy);

export const requireUserId = async (
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) => {
  const searchParams = new URLSearchParams([
    ["redirectTo", redirectTo],
    ["loginMessage", "Please login to continue"]
  ]);
  const session = await authenticator.isAuthenticated(request, {
    failureRedirect: `/?${searchParams}`
  });
  return session.user?.id;
};
