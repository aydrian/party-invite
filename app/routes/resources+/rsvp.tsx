import { conform, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import { ResponseType } from "@prisma/client";
import { type ActionArgs, json } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { z } from "zod";

import {
  Field,
  RadioGroupField,
  SubmitButton,
  TextareaField
} from "~/components/form.tsx";
import { rsvpCookie } from "~/utils/cookies.server.ts";
import { prisma } from "~/utils/db.server.ts";
import { redirectWithConfetti } from "~/utils/flash-session.server.ts";

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
  message = message ? message : undefined;

  const rsvp = await prisma.rsvp.upsert({
    create: {
      guests,
      message,
      name,
      partyId,
      response
    },
    select: { id: true },
    update: {
      guests,
      message,
      name,
      partyId,
      response
    },
    where: { id }
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
      <SubmitButton
        className="w-full sm:w-auto"
        size="sm"
        state={rsvpFetcher.state}
        submittingText="Submitting"
      >
        Submit
      </SubmitButton>
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
    <div>
      <div>Thank you</div>
      <div>{rsvp.name}</div>
    </div>
  );
}
