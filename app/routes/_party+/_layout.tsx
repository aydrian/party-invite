import {
  type LoaderArgs,
  Response,
  type V2_MetaFunction,
  json
} from "@remix-run/node";
import { Outlet, useLoaderData, useOutletContext } from "@remix-run/react";

import { Badge } from "~/components/ui/badge.tsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "~/components/ui/card.tsx";
import { prisma } from "~/utils/db.server.ts";
import env from "~/utils/env.server.ts";
import { cn } from "~/utils/misc.ts";

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
      where: { partyId: party.id }
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
    <div className="pb-8">
      <header className="container p-4">
        <div className="mx-auto mb-4 flex w-5/6 max-w-sm flex-col justify-between gap-4 rounded-sm bg-white p-4 shadow-md">
          <div className=" relative flex aspect-square w-full items-end justify-center bg-black">
            <p className="p-4 text-center font-anton font-black italic leading-tight text-white">
              I don't know about you,
              <br />
              but I'm feeling 42
            </p>
          </div>
          <div className="flex items-center justify-between px-4 font-permanant-marker text-3xl leading-tight">
            <div>A.H.</div>
            <div>1981</div>
          </div>
        </div>
        <h1 className="text-center font-anton text-3xl font-black italic leading-tight text-gray-900">
          {party.name}
        </h1>
        <h2 className="text-center font-anton text-xl font-black leading-tight text-gray-800">
          {new Intl.DateTimeFormat(undefined, {
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            month: "short",
            weekday: "short",
            year: "numeric"
          }).formatRange(startDate, endDate)}
        </h2>
        <h3 className="text-center font-anton text-lg font-black leading-tight text-gray-700">
          @ {party.location.name}
        </h3>
      </header>
      <main className="container flex flex-col items-center justify-center gap-4">
        <Outlet context={{ partyId: party.id }} />
        <Card className="w-full max-w-md grow opacity-75 shadow-md">
          <CardHeader>
            <CardTitle className="font-anton font-black italic leading-tight">
              Who's Attending?
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <dl className="flex w-full justify-around">
              <div className="text-center">
                <dt className="font-medium">Yes's</dt>
                <dd className="font-light">{rsvps["YES"]}</dd>
              </div>
              <div className="text-center">
                <dt className="font-medium">Maybe's</dt>
                <dd className="font-light">{rsvps["MAYBE"]}</dd>
              </div>
              <div className="text-center">
                <dt className="font-medium">No's</dt>
                <dd className="font-light">{rsvps["NO"]}</dd>
              </div>
            </dl>
            <ul className="flex flex-col gap-2">
              {messages.map((msg) => (
                <li key={msg.id}>
                  <div className="rounded-lg border bg-blue-300 p-2 text-sm">
                    {msg.message ?? "..."}
                  </div>
                  <div className="mt-1 flex items-center justify-end gap-1.5 text-xs">
                    <div>{msg.name}</div>
                    <Badge
                      className={cn(
                        "text-[.5rem] leading-snug",
                        msg.response === "YES" && "bg-green-600",
                        msg.response === "NO" && "bg-red-600",
                        msg.response === "MAYBE" && "bg-yellow-600 text-black"
                      )}
                    >
                      {msg.response}
                    </Badge>
                  </div>
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
