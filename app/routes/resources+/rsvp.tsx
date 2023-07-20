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
import { prisma } from "~/utils/db.server.ts";

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

  console.log({ submission });
  const { guests, message, name, partyId, response } = submission.value;
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

  submission.value.id = rsvp.id;
  return json({ status: "success", submission } as const);
}

export function RsvpForm({
  party
}: {
  party: { endDate: string; id: string; name: string; startDate: string };
}) {
  const rsvpFetcher = useFetcher<typeof action>();

  const [form, fields] = useForm({
    constraint: getFieldsetConstraint(RsvpFormSchema),
    defaultValue: {
      guests: "1",
      partyId: party.id,
      response: ResponseType.YES
    },
    id: "rsvp-form",
    lastSubmission: rsvpFetcher.data?.submission,
    onValidate({ formData }) {
      return parse(formData, { schema: RsvpFormSchema });
    },
    shouldRevalidate: "onBlur"
  });

  if (rsvpFetcher.data?.status === "success") {
    return <div>Thank you</div>;
  }

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
          { children: "Maybe", value: ResponseType.MAYBE }
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
