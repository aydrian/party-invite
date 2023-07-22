import { type DataFunctionArgs, json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { Button } from "~/components/ui/button.tsx";
import { CardContent, CardFooter } from "~/components/ui/card.tsx";
import { rsvpCookie } from "~/utils/cookies.server.ts";
import { prisma } from "~/utils/db.server.ts";

import { RsvpConfirm } from "../resources+/rsvp.tsx";

export async function loader({ params, request }: DataFunctionArgs) {
  const { rsvpId } = params;
  const rsvp = await prisma.rsvp.findUnique({
    select: {
      createdAt: true,
      guests: true,
      id: true,
      message: true,
      name: true,
      party: {
        select: {
          host: { select: { firstName: true, phone: true } },
          location: {
            select: {
              address1: true,
              city: true,
              crossStreets: true,
              instructions: true,
              name: true,
              state: true,
              zip: true
            }
          }
        }
      },
      response: true
    },
    where: { id: rsvpId }
  });

  if (!rsvp) {
    throw new Response("RSVP not found. ☹️", { status: 404 });
  }

  const hasCookie =
    (await rsvpCookie.parse(request.headers.get("Cookie"))) === rsvp.id;

  return json({ hasCookie, rsvp });
}

export default function RRsvpId() {
  const { hasCookie, rsvp } = useLoaderData<typeof loader>();
  return (
    <>
      <CardContent>
        <RsvpConfirm rsvp={rsvp} />
      </CardContent>
      {hasCookie ? (
        <CardFooter>
          <Button asChild size="sm">
            <Link to="./edit">Edit</Link>
          </Button>
        </CardFooter>
      ) : null}
    </>
  );
}
