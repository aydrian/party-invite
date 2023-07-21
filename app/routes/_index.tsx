import {
  type LoaderArgs,
  Response,
  type V2_MetaFunction,
  json
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "~/components/ui/card.tsx";
import { prisma } from "~/utils/db.server.ts";
import env from "~/utils/env.server.ts";

import { RsvpForm } from "./resources+/rsvp.tsx";

export async function loader({ request }: LoaderArgs) {
  const party = await prisma.party.findUnique({
    select: {
      endDate: true,
      host: { select: { firstName: true, phone: true } },
      id: true,
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
      },
      name: true,
      startDate: true
    },
    where: { id: env.PARTY_ID }
  });

  if (!party) {
    throw new Response("Party not found. ☹️", { status: 404 });
  }

  const [rsvpSums, messages] = await Promise.all([
    prisma.rsvp.groupBy({
      _sum: { guests: true },
      by: ["response"],
      where: { partyId: party.id }
    }),
    prisma.rsvp.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        guests: true,
        id: true,
        message: true,
        name: true,
        response: true
      },
      where: { AND: [{ partyId: party.id }, { message: { not: null } }] }
    })
  ]);

  const rsvps = rsvpSums
    .map(({ _sum: { guests }, response }) => ({
      [response]: guests
    }))
    .reduce((acc, cur) => ({ ...acc, ...cur }), { MAYBE: 0, YES: 0 });

  return json({ messages, party, rsvps });
}

export const meta: V2_MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `You're invited to ${data?.party.name}` },
    { content: `An invitation to ${data?.party.name}`, name: "description" }
  ];
};

export default function Index() {
  const { messages, party, rsvps } = useLoaderData<typeof loader>();
  console.log({ messages });
  const startDate = new Date(party.startDate);
  const endDate = new Date(party.endDate);
  return (
    <div>
      <header className="container">
        <h1>You're invited to {party.name}</h1>
        <h2>
          {new Intl.DateTimeFormat(undefined, {
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            month: "short",
            weekday: "short",
            year: "numeric"
          }).formatRange(startDate, endDate)}
        </h2>
        <dl>
          <dt>Yeses</dt>
          <dd>{rsvps["YES"]}</dd>
          <dt>Maybes</dt>
          <dd>{rsvps["MAYBE"]}</dd>
        </dl>
      </header>
      <main className="container flex flex-wrap items-center justify-center gap-2">
        <Card className="mx-auto max-w-md opacity-75 shadow-md">
          <CardHeader>
            <CardTitle>RSVP</CardTitle>
          </CardHeader>
          <CardContent>
            <RsvpForm party={party} />
          </CardContent>
        </Card>
        <Card className="mx-auto max-w-md opacity-75 shadow-md">
          <CardHeader>
            <CardTitle>Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              {messages.map((msg) => (
                <li key={msg.id}>
                  <div>{msg.message}</div>
                  <div>{msg.name}</div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
