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

const RsvpFormSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  guests: z.string().default("1").pipe(z.coerce.number()),
  lastName: z.string().min(1, "First name is required."),
  message: z.string().optional(),
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

  return json({ status: "success", submission } as const);
}

export function RsvpForm({ partyId }: { partyId: string }) {
  const rsvpFetcher = useFetcher<typeof action>();

  const [form, fields] = useForm({
    constraint: getFieldsetConstraint(RsvpFormSchema),
    defaultValue: { partyId, response: ResponseType.YES },
    id: "rsvp-form",
    lastSubmission: rsvpFetcher.data?.submission,
    onValidate({ formData }) {
      return parse(formData, { schema: RsvpFormSchema });
    },
    shouldRevalidate: "onBlur"
  });

  return (
    <rsvpFetcher.Form action="/resources/rsvp" method="post" {...form.props}>
      <input
        name={fields.partyId.name}
        type="hidden"
        value={fields.partyId.defaultValue}
      />
      <Field
        errors={fields.firstName.errors}
        inputProps={conform.input(fields.firstName)}
        labelProps={{ children: "First Name", htmlFor: fields.firstName.id }}
      />
      <Field
        errors={fields.lastName.errors}
        inputProps={conform.input(fields.lastName)}
        labelProps={{ children: "Last Name", htmlFor: fields.lastName.id }}
      />
      <RadioGroupField
        options={[
          { children: "Yes", value: ResponseType.YES },
          { children: "Maybe", value: ResponseType.MAYBE }
        ]}
        errors={fields.response.errors}
        inputProps={conform.input(fields.response, { type: "radio" })}
        labelProps={{ children: "Response", htmlFor: fields.response.id }}
        layout="horizontal"
      />
      <Field
        labelProps={{
          children: "Guests (including yourself)",
          htmlFor: fields.guests.id
        }}
        errors={fields.guests.errors}
        inputProps={{ ...conform.input(fields.guests), type: "number" }}
      />
      <TextareaField
        labelProps={{
          children: "Message",
          htmlFor: fields.message.id
        }}
        errors={fields.message.errors}
        textareaProps={conform.textarea(fields.message)}
      />
      <SubmitButton
        className="mt-2 w-full sm:w-auto"
        state={rsvpFetcher.state}
        submittingText="Submitting"
      >
        Submit
      </SubmitButton>
    </rsvpFetcher.Form>
  );
}
