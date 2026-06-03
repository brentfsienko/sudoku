import { Liveblocks } from "@liveblocks/node";
import { NextResponse } from "next/server";
import { randomUsername } from "@/lib/stats/profile";
import { randomDogId } from "@/lib/theme/dogs";

const secret = process.env.LIVEBLOCKS_SECRET_KEY;

export async function POST(request: Request) {
  if (!secret) {
    return NextResponse.json(
      {
        error:
          "Missing LIVEBLOCKS_SECRET_KEY. Add it to .env.local (and Vercel env) to enable multiplayer.",
      },
      { status: 501 },
    );
  }

  const liveblocks = new Liveblocks({ secret });

  let body: { name?: string; dogId?: string } = {};
  try {
    body = await request.json();
  } catch {
    // no body provided; fall back to randoms
  }

  const userId = `anon-${crypto.randomUUID()}`;
  const name = body.name?.trim() || randomUsername();
  const dogId = body.dogId || randomDogId();

  const session = liveblocks.prepareSession(userId, {
    userInfo: { name, dogId },
  });

  // Casual game: any authenticated visitor may join any Floof room.
  session.allow("floof-*", session.FULL_ACCESS);

  const { status, body: responseBody } = await session.authorize();
  return new NextResponse(responseBody, { status });
}
