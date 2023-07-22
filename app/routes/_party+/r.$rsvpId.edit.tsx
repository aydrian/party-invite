import { type DataFunctionArgs, json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { CardContent } from "~/components/ui/card.tsx";
import { rsvpCookie } from "~/utils/cookies.server.ts";
import { prisma } from "~/utils/db.server.ts";

import { RsvpForm } from "../resources+/rsvp.tsx";

export async function loader({ params, request }: DataFunctionArgs) {
  const { rsvpId } = params;
  const hasCookie =
    (await rsvpCookie.parse(request.headers.get("Cookie"))) === rsvpId;

  if (!hasCookie) {
    return redirect(`../`);
  }

  const findRsvp = await prisma.rsvp.findUnique({
    select: {
      guests: true,
      id: true,
      message: true,
      name: true,
      partyId: true,
      response: true
    },
    where: { id: rsvpId }
  });

  if (!findRsvp) {
    throw new Response("RSVP not found. ☹️", { status: 404 });
  }

  const { partyId, ...rsvp } = findRsvp;

  return json({ partyId, rsvp });
}

export default function RRsvpIdEdit() {
  const { partyId, rsvp } = useLoaderData<typeof loader>();
  return (
    <CardContent>
      <RsvpForm partyId={partyId} rsvp={rsvp} />
    </CardContent>
  );
}
