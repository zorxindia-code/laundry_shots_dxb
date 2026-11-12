import { services } from "@/config/services";

/**
 * Contact enquiry: fields, validation and result states. Shared by the form
 * (instant client-side feedback) and the server action (authoritative check).
 */
export const ENQUIRY_FIELDS = ["name", "phone", "email", "service", "message"] as const;
export type EnquiryField = (typeof ENQUIRY_FIELDS)[number];
export type EnquiryValues = Record<EnquiryField, string>;
export type EnquiryErrors = Partial<Record<EnquiryField, string>>;

/** Options for "Service interested in". */
export const ENQUIRY_SERVICES: readonly string[] = [...services.map((s) => s.title), "General enquiry"];

export const ENQUIRY_LIMITS = { name: 100, phone: 20, email: 254, message: 2000 } as const;
export const MESSAGE_MIN = 10;

/** Hidden honeypot field; real visitors never fill it. */
export const HONEYPOT_FIELD = "company";

export type EnquiryState =
  | { status: "idle" }
  | { status: "invalid"; errors: EnquiryErrors }
  | { status: "success" }
  /** No delivery endpoint is configured — nothing was sent. */
  | { status: "unavailable" }
  /** The delivery endpoint failed — nothing was confirmed as sent. */
  | { status: "error" };

export const initialEnquiryState: EnquiryState = { status: "idle" };

export function readEnquiry(formData: FormData): EnquiryValues {
  const read = (field: EnquiryField) => {
    const value = formData.get(field);
    return typeof value === "string" ? value.trim() : "";
  };
  return {
    name: read("name"),
    phone: read("phone"),
    email: read("email"),
    service: read("service"),
    message: read("message"),
  };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[\d\s().-]{7,20}$/;

export function validateEnquiry(values: EnquiryValues): EnquiryErrors {
  const errors: EnquiryErrors = {};

  if (values.name.length < 2) errors.name = "Please enter your full name.";
  else if (values.name.length > ENQUIRY_LIMITS.name) errors.name = "Please keep your name under 100 characters.";

  if (values.phone && (!PHONE.test(values.phone) || values.phone.replace(/\D/g, "").length < 7)) {
    errors.phone = "Please enter a valid phone number, e.g. +971 50 000 0000.";
  }

  if (!values.email) errors.email = "Please enter your email address.";
  else if (!EMAIL.test(values.email) || values.email.length > ENQUIRY_LIMITS.email) {
    errors.email = "Please enter a valid email address.";
  }

  if (!ENQUIRY_SERVICES.includes(values.service)) errors.service = "Please choose a service.";

  if (values.message.length < MESSAGE_MIN) errors.message = `Please tell us a little more (at least ${MESSAGE_MIN} characters).`;
  else if (values.message.length > ENQUIRY_LIMITS.message) {
    errors.message = `Please keep your message under ${ENQUIRY_LIMITS.message} characters.`;
  }

  return errors;
}
