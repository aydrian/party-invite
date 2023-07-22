import { conform, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import { ResponseType } from "@prisma/client";
import { type ActionArgs, json, redirect } from "@remix-run/node";
import { Link, useFetcher } from "@remix-run/react";
import { z } from "zod";

import {
  Field,
  RadioGroupField,
  SubmitButton,
  TextareaField
} from "~/components/form.tsx";
import { Badge } from "~/components/ui/badge.tsx";
import { Button } from "~/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "~/components/ui/card.tsx";
import { rsvpCookie } from "~/utils/cookies.server.ts";
import { prisma } from "~/utils/db.server.ts";
import { redirectWithConfetti } from "~/utils/flash-session.server.ts";
import { cn, formatPhoneNumber } from "~/utils/misc.ts";

const RsvpFormSchema = z.object({
  guests: z
    .string()
    .default("1")
    .pipe(z.coerce.number().min(1, "There should be at least 1 guest.")),
  id: z.string().optional(),
  message: z.string().optional(),
  name: z.string().min(1, "Please enter your name."),
  partyId: z.string(),
  response: z.nativeEnum(ResponseType)
});

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = parse(formData, {
    acceptMultipleErrors: () => true,
    schema: RsvpFormSchema
  });
  if (!submission.value) {
    return json(
      {
        status: "error",
        submission
      } as const,
      { status: 400 }
    );
  }
  if (submission.intent !== "submit") {
    return json({ status: "idle", submission } as const);
  }

  let { guests, id, message, name, partyId, response } = submission.value;
  id = id ? id : undefined;
  message = message ? message : undefined;

  if (id) {
    const rsvp = await prisma.rsvp.update({
      data: {
        guests,
        message,
        name,
        partyId,
        response
      },
      select: { id: true },
      where: { id }
    });

    return redirect(`/r/${rsvp.id}`);
  }

  const rsvp = await prisma.rsvp.create({
    data: {
      guests,
      message,
      name,
      partyId,
      response
    },
    select: { id: true }
  });

  return redirectWithConfetti(`/r/${rsvp.id}`, {
    headers: { "Set-Cookie": await rsvpCookie.serialize(rsvp.id) }
  });
}

export function RsvpForm({
  partyId,
  rsvp
}: {
  partyId: string;
  rsvp?: {
    guests: number;
    id: string;
    message: null | string;
    name: string;
    response: ResponseType;
  };
}) {
  const rsvpFetcher = useFetcher<typeof action>();

  const [form, fields] = useForm({
    constraint: getFieldsetConstraint(RsvpFormSchema),
    defaultValue: {
      guests: rsvp?.guests ?? "1",
      id: rsvp?.id,
      message: rsvp?.message,
      name: rsvp?.name,
      partyId,
      response: rsvp?.response ?? ResponseType.YES
    },
    id: "rsvp-form",
    lastSubmission: rsvpFetcher.data?.submission,
    onValidate({ formData }) {
      return parse(formData, { schema: RsvpFormSchema });
    },
    shouldRevalidate: "onBlur"
  });

  return (
    <rsvpFetcher.Form
      action="/resources/rsvp"
      className="flex flex-col"
      method="post"
      preventScrollReset
      {...form.props}
    >
      <input
        name={fields.partyId.name}
        type="hidden"
        value={fields.partyId.defaultValue}
      />
      <input
        name={fields.id.name}
        type="hidden"
        value={fields.id.defaultValue}
      />
      <RadioGroupField
        inputProps={{
          ...conform.input(fields.response, {
            ariaAttributes: true,
            hidden: true
          })
        }}
        labelProps={{
          children: "Are you coming?",
          htmlFor: fields.response.id
        }}
        options={[
          { children: "Yes", value: ResponseType.YES },
          { children: "Maybe", value: ResponseType.MAYBE },
          { children: "No", value: ResponseType.NO }
        ]}
        errors={fields.response.errors}
        layout="horizontal"
      />
      <Field
        errors={fields.name.errors}
        inputProps={conform.input(fields.name)}
        labelProps={{ children: "What's your name?", htmlFor: fields.name.id }}
      />
      <Field
        inputProps={{
          ...conform.input(fields.guests),
          inputMode: "numeric",
          min: "1",
          type: "number"
        }}
        labelProps={{
          children: "How many people are you bringing, including yourself?",
          htmlFor: fields.guests.id
        }}
        errors={fields.guests.errors}
      />
      <TextareaField
        labelProps={{
          children: "Leave a message for the wall?",
          htmlFor: fields.message.id
        }}
        errors={fields.message.errors}
        textareaProps={conform.textarea(fields.message)}
      />
      <div className="flex w-full items-center justify-between gap-4">
        <SubmitButton
          className="w-full sm:w-auto"
          size="sm"
          state={rsvpFetcher.state}
          submittingText="Submitting"
        >
          Submit
        </SubmitButton>
        {rsvp?.id ? (
          <Button asChild className="w-full sm:w-auto" variant="secondary">
            <Link to="../">Cancel</Link>
          </Button>
        ) : null}
      </div>
    </rsvpFetcher.Form>
  );
}

export function RsvpConfirm({
  rsvp
}: {
  rsvp: {
    createdAt: string;
    guests: number;
    id: string;
    message: null | string;
    name: string;
    party: {
      host: {
        firstName: string;
        phone: string;
      };
      location: {
        address1: string;
        city: string;
        crossStreets: string;
        instructions: null | string;
        name: string;
        state: string;
        zip: string;
      };
    };
    response: ResponseType;
  };
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <span>{rsvp.name}</span>
          <Badge
            className={cn(
              rsvp.response === "YES" && "bg-green-600",
              rsvp.response === "NO" && "bg-red-600",
              rsvp.response === "MAYBE" && "bg-yellow-600 text-black"
            )}
          >
            {rsvp.response}
          </Badge>
        </CardTitle>
        <CardDescription>{`${rsvp.guests} ${
          rsvp.guests === 1 ? "Guest" : "Guests"
        }`}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {rsvp.message ? (
          <div>
            <div className="text-xs text-gray-800">Message:</div>
            <div>{rsvp.message}</div>
          </div>
        ) : null}
        <div>
          <div className="text-xs text-gray-800">Address:</div>
          <p>{rsvp.party.location.address1}</p>
          <p>
            {rsvp.party.location.city}, {rsvp.party.location.state}{" "}
            {rsvp.party.location.zip} (
            <a
              href={`https://maps.google.com/?${new URLSearchParams([
                [
                  "q",
                  [
                    rsvp.party.location.address1,
                    rsvp.party.location.city,
                    rsvp.party.location.state,
                    rsvp.party.location.zip
                  ].join(",")
                ]
              ])}`}
              className="text-blue-600"
              rel="noreferrer"
              target="_blank"
            >
              Map
            </a>
            )
          </p>
          <div className="text-xs text-gray-800">Cross Streets:</div>
          <p>{rsvp.party.location.crossStreets}</p>
          {rsvp.party.location.instructions ? (
            <>
              <div className="text-xs text-gray-800">Instructions:</div>
              <p>{rsvp.party.location.instructions}</p>
            </>
          ) : null}
        </div>
        <div className="text-center font-medium">
          Contact {rsvp.party.host.firstName} with any questions.{" "}
          <a className="text-blue-600" href={`tel:+${rsvp.party.host.phone}`}>
            {formatPhoneNumber(rsvp.party.host.phone, "+# (###) ###-####")}
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
