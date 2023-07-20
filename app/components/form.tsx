import { useInputEvent } from "@conform-to/react";
import { useId, useRef } from "react";

import { Button, type ButtonProps } from "~/components/ui/button.tsx";
import { Checkbox, type CheckboxProps } from "~/components/ui/checkbox.tsx";
import { Input } from "~/components/ui/input.tsx";
import { Label } from "~/components/ui/label.tsx";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group.tsx";
import { Textarea } from "~/components/ui/textarea.tsx";
import { cn } from "~/utils/misc.ts";

export type ListOfErrors = Array<null | string | undefined> | null | undefined;

export function ErrorList({
  errors,
  id
}: {
  errors?: ListOfErrors;
  id?: string;
}) {
  const errorsToRender = errors?.filter(Boolean);
  if (!errorsToRender?.length) return null;
  return (
    <ul className="flex flex-col gap-1" id={id}>
      {errorsToRender.map((e) => (
        <li className="text-[10px] text-red-600" key={e}>
          {e}
        </li>
      ))}
    </ul>
  );
}

export function Field({
  className,
  errors,
  inputProps,
  labelProps
}: {
  className?: string;
  errors?: ListOfErrors;
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
  labelProps: React.LabelHTMLAttributes<HTMLLabelElement>;
}) {
  const fallbackId = useId();
  const id = inputProps.id ?? fallbackId;
  const errorId = errors?.length ? `${id}-error` : undefined;
  return (
    <div className={className}>
      <Label htmlFor={id} {...labelProps} />
      <Input
        aria-describedby={errorId}
        aria-invalid={errorId ? true : undefined}
        id={id}
        {...inputProps}
      />
      <div className="min-h-[32px] px-4 pb-3 pt-1">
        {errorId ? <ErrorList errors={errors} id={errorId} /> : null}
      </div>
    </div>
  );
}

export function TextareaField({
  className,
  errors,
  labelProps,
  textareaProps
}: {
  className?: string;
  errors?: ListOfErrors;
  labelProps: React.LabelHTMLAttributes<HTMLLabelElement>;
  textareaProps: React.InputHTMLAttributes<HTMLTextAreaElement>;
}) {
  const fallbackId = useId();
  const id = textareaProps.id ?? textareaProps.name ?? fallbackId;
  const errorId = errors?.length ? `${id}-error` : undefined;
  return (
    <div className={className}>
      <Label htmlFor={id} {...labelProps} />
      <Textarea
        aria-describedby={errorId}
        aria-invalid={errorId ? true : undefined}
        id={id}
        {...textareaProps}
      />
      <div className="min-h-[32px] px-4 pb-3 pt-1">
        {errorId ? <ErrorList errors={errors} id={errorId} /> : null}
      </div>
    </div>
  );
}

export function CheckboxField({
  buttonProps,
  className,
  errors,
  labelProps
}: {
  buttonProps: CheckboxProps;
  className?: string;
  errors?: ListOfErrors;
  labelProps: JSX.IntrinsicElements["label"];
}) {
  const fallbackId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  // To emulate native events that Conform listen to:
  // See https://conform.guide/integrations
  const control = useInputEvent({
    // Retrieve the checkbox element by name instead as Radix does not expose the internal checkbox element
    onFocus: () => buttonRef.current?.focus(),
    // See https://github.com/radix-ui/primitives/discussions/874
    ref: () =>
      buttonRef.current?.form?.elements.namedItem(buttonProps.name ?? "")
  });
  const id = buttonProps.id ?? buttonProps.name ?? fallbackId;
  const errorId = errors?.length ? `${id}-error` : undefined;
  return (
    <div className={className}>
      <div className="flex gap-2">
        <Checkbox
          aria-describedby={errorId}
          aria-invalid={errorId ? true : undefined}
          id={id}
          ref={buttonRef}
          {...buttonProps}
          onBlur={(event) => {
            control.blur();
            buttonProps.onBlur?.(event);
          }}
          onCheckedChange={(state) => {
            control.change(Boolean(state.valueOf()));
            buttonProps.onCheckedChange?.(state);
          }}
          onFocus={(event) => {
            control.focus();
            buttonProps.onFocus?.(event);
          }}
          type="button"
        />
        <label
          htmlFor={id}
          {...labelProps}
          className="text-body-xs self-center text-muted-foreground"
        />
      </div>
      <div className="px-4 pb-3 pt-1">
        {errorId ? <ErrorList errors={errors} id={errorId} /> : null}
      </div>
    </div>
  );
}

export function RadioGroupField({
  className,
  errors,
  inputProps,
  labelProps,
  layout = "vertical",
  options
}: {
  className?: string;
  errors?: ListOfErrors;
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
  labelProps: React.LabelHTMLAttributes<HTMLLabelElement>;
  layout?: "horizontal" | "vertical";
  options: { children: React.ReactNode; value: string }[];
}) {
  const fallbackId = useId();
  const id = inputProps.id ?? inputProps.name ?? fallbackId;
  const errorId = errors?.length ? `${id}-error` : undefined;

  return (
    <div className={className}>
      <Label htmlFor={id} {...labelProps} />
      <RadioGroup
        className={cn(layout === "horizontal" && "flex flex-row")}
        defaultValue={inputProps.defaultValue?.toString()}
        id={id}
      >
        {options.map(({ children, value }) => {
          const optionId = `${id}-radio-item-${value}`;
          return (
            <div className="flex items-center space-x-2" key={optionId}>
              <RadioGroupItem id={optionId} value={value} />
              <Label htmlFor={optionId}>{children}</Label>
            </div>
          );
        })}
      </RadioGroup>
      <div className="min-h-[32px] px-4 pb-3 pt-1">
        {errorId ? <ErrorList errors={errors} id={errorId} /> : null}
      </div>
    </div>
  );
}

export function SubmitButton({
  state = "idle",
  submittingText = "Submitting...",
  ...props
}: ButtonProps & {
  state?: "idle" | "loading" | "submitting";
  submittingText?: string;
}) {
  return (
    <Button
      {...props}
      className={props.className}
      disabled={props.disabled || state !== "idle"}
    >
      <span>{state !== "idle" ? submittingText : props.children}</span>
    </Button>
  );
}
