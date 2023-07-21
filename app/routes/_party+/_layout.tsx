import {
  type LoaderArgs,
  Response,
  type V2_MetaFunction,
  json
} from "@remix-run/node";
import { Outlet, useLoaderData, useOutletContext } from "@remix-run/react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "~/components/ui/card.tsx";
import { prisma } from "~/utils/db.server.ts";
import env from "~/utils/env.server.ts";

export type OutletContext = {
  partyId: string;
};

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
    .reduce((acc, cur) => ({ ...acc, ...cur }), { MAYBE: 0, NO: 0, YES: 0 });

  return json({ messages, party, rsvps });
}

export const meta: V2_MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `You're invited to ${data?.party.name}` },
    { content: `An invitation to ${data?.party.name}`, name: "description" }
  ];
};

export default function Layout() {
  const { messages, party, rsvps } = useLoaderData<typeof loader>();
  const startDate = new Date(party.startDate);
  const endDate = new Date(party.endDate);
  return (
    <div className="pb-4">
      <header className="container p-4">
        <h1 className="text-center text-3xl font-bold leading-tight text-gray-900">
          {party.name}
        </h1>
        <h2 className="text-center text-2xl font-semibold leading-tight text-gray-700">
          {new Intl.DateTimeFormat(undefined, {
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            month: "short",
            weekday: "short",
            year: "numeric"
          }).formatRange(startDate, endDate)}
        </h2>
        <dl className="flex w-full justify-center gap-4">
          <div className="text-center">
            <dt className="font-medium">Yes's</dt>
            <dd className="font-light">{rsvps["YES"]}</dd>
          </div>
          <div className="text-center">
            <dt className="font-medium">Maybes</dt>
            <dd className="font-light">{rsvps["MAYBE"]}</dd>
          </div>
          <div className="text-center">
            <dt className="font-medium">No's</dt>
            <dd className="font-light">{rsvps["NO"]}</dd>
          </div>
        </dl>
      </header>
      <main className="container flex flex-col items-center justify-center gap-4">
        <Outlet context={{ partyId: party.id }} />
        <Card className="w-full max-w-md grow opacity-75 shadow-md">
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

export function useParty() {
  return useOutletContext<OutletContext>();
}
