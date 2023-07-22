import { type DataFunctionArgs, redirect } from "@remix-run/node";

import { CardContent } from "~/components/ui/card.tsx";
import { RsvpForm } from "~/routes/resources+/rsvp.tsx";
import { rsvpCookie } from "~/utils/cookies.server.ts";

import { useParty } from "./_layout.tsx";

export async function loader({ request }: DataFunctionArgs) {
  const savedRsvpId = await rsvpCookie.parse(request.headers.get("Cookie"));
  if (savedRsvpId) {
    return redirect(`/r/${savedRsvpId}`);
  }
  return null;
}

export default function Index() {
  const { partyId } = useParty();
  return (
    <CardContent>
      <RsvpForm partyId={partyId} />
    </CardContent>
  );
}
