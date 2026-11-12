"use client";

import { AlertCircle, CheckCircle2, ChevronDown, Info, LoaderCircle } from "lucide-react";
import { type FormEvent, type ReactNode, startTransition, useActionState, useId, useState } from "react";

import { submitEnquiry } from "@/app/contact/actions";
import { ButtonArrow, buttonClasses } from "@/components/ui/ButtonLink";
import {
  ENQUIRY_LIMITS,
  ENQUIRY_SERVICES,
  HONEYPOT_FIELD,
  initialEnquiryState,
  readEnquiry,
  validateEnquiry,
  type EnquiryErrors,
  type EnquiryField,
  type EnquiryState,
} from "@/lib/enquiry";
import { cn } from "@/lib/utils";

/**
 * Enquiry form. Validates instantly in the browser, then submits to the
 * `submitEnquiry` server action (which validates again and delivers to the
 * configured endpoint). Success is only shown when delivery succeeded.
 * Values are kept on errors; the form works without JavaScript too.
 */
export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitEnquiry, initialEnquiryState);
  const [clientErrors, setClientErrors] = useState<EnquiryErrors>({});
  const [dismissed, setDismissed] = useState<EnquiryState | null>(null);

  const serverErrors = state.status === "invalid" ? state.errors : {};
  const errors = Object.keys(clientErrors).length > 0 ? clientErrors : serverErrors;
  const succeeded = state.status === "success" && dismissed !== state;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const found = validateEnquiry(readEnquiry(formData));
    setClientErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    startTransition(() => formAction(formData));
  };

  const clearError = (field: EnquiryField) => {
    if (clientErrors[field]) {
      setClientErrors((previous) => {
        const next = { ...previous };
        delete next[field];
        return next;
      });
    }
  };

  if (succeeded) {
    return (
      <div role="status" className="flex min-h-[32rem] flex-col items-start justify-center gap-6">
        <CheckCircle2 aria-hidden className="size-10 text-brand-navy" strokeWidth={1.5} />
        <h3 className="text-[clamp(2rem,4vw,3rem)] font-bold uppercase leading-[0.95] tracking-[-0.04em]">
          Thank you.
          <br />
          Your enquiry is on its way.
        </h3>
        <p className="max-w-[40ch] text-base leading-relaxed text-brand-navy/70">
          We&apos;ve received your message and will get back to you as soon as we can.
        </p>
        <button
          type="button"
          onClick={() => {
            setDismissed(state);
            setClientErrors({});
          }}
          className={buttonClasses("outline-dark")}
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={onSubmit}
      noValidate
      aria-busy={pending}
      aria-describedby="enquiry-status"
      className="grid gap-8"
    >
      <Field label="Full name" name="name" error={errors.name}>
        {(props) => (
          <input
            {...props}
            type="text"
            autoComplete="name"
            maxLength={ENQUIRY_LIMITS.name}
            onInput={() => clearError("name")}
            required
          />
        )}
      </Field>

      <div className="grid gap-8 sm:grid-cols-2">
        <Field label="Phone number" name="phone" hint="Optional" error={errors.phone}>
          {(props) => (
            <input
              {...props}
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              maxLength={ENQUIRY_LIMITS.phone}
              onInput={() => clearError("phone")}
            />
          )}
        </Field>
        <Field label="Email address" name="email" error={errors.email}>
          {(props) => (
            <input
              {...props}
              type="email"
              autoComplete="email"
              maxLength={ENQUIRY_LIMITS.email}
              onInput={() => clearError("email")}
              required
            />
          )}
        </Field>
      </div>

      <Field label="Service interested in" name="service" error={errors.service}>
        {(props) => (
          <span className="relative block">
            <select
              {...props}
              defaultValue=""
              onChange={() => clearError("service")}
              required
              className={cn(props.className, "appearance-none pr-10")}
            >
              <option value="" disabled>
                Choose a service
              </option>
              {ENQUIRY_SERVICES.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden className="pointer-events-none absolute right-0 top-1/2 size-5 -translate-y-1/2" strokeWidth={1.5} />
          </span>
        )}
      </Field>

      <Field label="Message" name="message" error={errors.message}>
        {(props) => (
          <textarea
            {...props}
            rows={5}
            maxLength={ENQUIRY_LIMITS.message}
            onInput={() => clearError("message")}
            required
            className={cn(props.className, "resize-y")}
          />
        )}
      </Field>

      {/* Honeypot: hidden from people and assistive tech. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Company
          <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div id="enquiry-status" aria-live="polite">
        <StatusMessage state={state} pending={pending} hasErrors={Object.keys(errors).length > 0} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-6">
        <p className="text-xs text-brand-navy/55">All fields are required unless marked optional.</p>
        <button type="submit" disabled={pending} className={buttonClasses("navy", "disabled:cursor-wait disabled:opacity-70")}>
          {pending ? (
            <>
              Sending
              <LoaderCircle aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
            </>
          ) : (
            <>
              Send enquiry
              <ButtonArrow className="text-brand-yellow" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */

interface ControlProps {
  id: string;
  name: string;
  className: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
}

function Field({
  label,
  name,
  hint,
  error,
  children,
}: {
  label: string;
  name: EnquiryField;
  hint?: string;
  error?: string;
  children: (props: ControlProps) => ReactNode;
}) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between gap-4 text-[0.64rem] font-semibold uppercase tracking-[0.26em] text-brand-navy/70">
        {label}
        {hint && <span className="font-medium normal-case tracking-normal text-brand-navy/45">{hint}</span>}
      </label>
      {children({
        id,
        name,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? errorId : undefined,
        className: cn(
          "mt-3 block w-full rounded-none border-0 border-b bg-transparent py-3 text-lg text-brand-navy outline-none transition-[border-color,box-shadow] duration-300 placeholder:text-brand-navy/35 focus:border-brand-navy focus:shadow-[0_1.5px_0_0_var(--color-brand-navy)]",
          error ? "border-[#B42318] shadow-[0_1.5px_0_0_#B42318]" : "border-brand-navy/25",
        ),
      })}
      {error && (
        <p id={errorId} className="mt-2 flex items-center gap-2 text-sm text-[#B42318]">
          <AlertCircle aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
          {error}
        </p>
      )}
    </div>
  );
}

function StatusMessage({ state, pending, hasErrors }: { state: EnquiryState; pending: boolean; hasErrors: boolean }) {
  if (pending) return <p className="sr-only">Sending your enquiry…</p>;
  if (hasErrors) {
    return (
      <Notice tone="error" icon={<AlertCircle aria-hidden className="size-5 shrink-0" strokeWidth={1.75} />}>
        Please check the highlighted fields.
      </Notice>
    );
  }
  if (state.status === "unavailable") {
    return (
      <Notice tone="info" icon={<Info aria-hidden className="size-5 shrink-0" strokeWidth={1.75} />}>
        <strong className="font-semibold">Online enquiries aren&apos;t connected yet</strong> — your message has not
        been sent. Please reach us directly using the contact details on this page.
        {process.env.NODE_ENV === "development" && (
          <span className="mt-2 block font-mono text-xs opacity-70">
            Dev: set CONTACT_FORM_ENDPOINT to enable delivery (see .env.example).
          </span>
        )}
      </Notice>
    );
  }
  if (state.status === "error") {
    return (
      <Notice tone="error" icon={<AlertCircle aria-hidden className="size-5 shrink-0" strokeWidth={1.75} />}>
        <strong className="font-semibold">Your enquiry couldn&apos;t be sent.</strong> Please try again in a moment,
        or reach us directly using the contact details on this page.
      </Notice>
    );
  }
  return null;
}

function Notice({ tone, icon, children }: { tone: "info" | "error"; icon: ReactNode; children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex gap-3 border-l-2 px-4 py-3 text-sm leading-relaxed",
        tone === "error" ? "border-[#B42318] bg-[#B42318]/[0.06] text-[#7A1A12]" : "border-brand-navy bg-brand-light-blue text-brand-navy",
      )}
    >
      {icon}
      <div>{children}</div>
    </div>
  );
}
