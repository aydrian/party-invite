import { type DataFunctionArgs, redirect } from "@remix-run/node";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "~/components/ui/card.tsx";
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
    <Card className="w-full max-w-md opacity-75 shadow-md md:min-w-[28rem]">
      <CardHeader>
        <CardTitle>RSVP</CardTitle>
      </CardHeader>
      <CardContent>
        <RsvpForm partyId={partyId} />
      </CardContent>
    </Card>
  );
}
