import { Liveblocks } from "@liveblocks/node";
import { NextApiRequest, NextApiResponse } from "next";

/**
 * Authenticating your Liveblocks application
 * https://liveblocks.io/docs/authentication
 */

const liveblocksSecretKey = process.env.LIVEBLOCKS_SECRET_KEY;

if (!liveblocksSecretKey) {
  throw new Error("LIVEBLOCKS_SECRET_KEY environment variable is required");
}

const liveblocks = new Liveblocks({
  secret: liveblocksSecretKey,
});

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  // We're generating random users and avatars here.
  // In a real-world scenario, this is where you'd assign the
  // user based on their real identity from your auth provider.
  const userIndex = Math.floor(Math.random() * NAMES.length);

  // Create a session for the current user (access token auth)
  const session = liveblocks.prepareSession(`user-${userIndex}`, {
    userInfo: {
      name: NAMES[userIndex],
      avatar: `https://liveblocks.io/avatars/avatar-${userIndex + 1}.png`,
    },
  });

  // Use a naming pattern to allow access to rooms with a wildcard
  session.allow("*", session.FULL_ACCESS);

  const { status, body } = await session.authorize();
  res.status(status).end(body);
}
const NAMES = [
  "Charlie Layne",
  "Mislav Abha",
  "Tatum Paolo",
  "Anjali Wanda",
  "Jody Hekla",
  "Emil Joyce",
  "Jory Quispe",
  "Quinn Elton",
];
