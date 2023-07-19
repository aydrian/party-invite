import {
  type LoaderArgs,
  Response,
  type V2_MetaFunction,
  json
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { prisma } from "~/utils/db.server.ts";
import env from "~/utils/env.server.ts";

export async function loader({ request }: LoaderArgs) {
  const party = await prisma.party.findUnique({
    select: { endDate: true, name: true, startDate: true },
    where: { id: env.PARTY_ID }
  });

  if (!party) {
    throw new Response("Party not found. ☹️", { status: 404 });
  }
  return json({ party });
}

export const meta: V2_MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `You're invited to ${data?.party.name}` },
    { content: `An invitation to ${data?.party.name}`, name: "description" }
  ];
};

export default function Index() {
  const { party } = useLoaderData<typeof loader>();
  const startDate = new Date(party.startDate);
  const endDate = new Date(party.endDate);
  return (
    <div>
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
    </div>
  );
}
