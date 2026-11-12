"use server";

import {
  HONEYPOT_FIELD,
  readEnquiry,
  validateEnquiry,
  type EnquiryState,
} from "@/lib/enquiry";

/**
 * Contact enquiry submission — the integration boundary.
 *
 * Delivery is a JSON POST to `CONTACT_FORM_ENDPOINT` (server-only env var),
 * e.g. a form service, automation webhook or your own API. Optional
 * `CONTACT_FORM_TOKEN` is sent as a Bearer token. Success is reported ONLY
 * when that endpoint responds 2xx; with no endpoint configured the form says
 * so and nothing is pretended to be sent.
 *
 * Payload: { name, phone, email, service, message, source, submittedAt }.
 */
export async function submitEnquiry(_previous: EnquiryState, formData: FormData): Promise<EnquiryState> {
  // Bots fill the hidden honeypot; don't deliver (and don't claim success).
  if (formData.get(HONEYPOT_FIELD)) return { status: "error" };

  const values = readEnquiry(formData);
  const errors = validateEnquiry(values);
  if (Object.keys(errors).length > 0) return { status: "invalid", errors };

  const endpoint = process.env.CONTACT_FORM_ENDPOINT;
  if (!endpoint) return { status: "unavailable" };

  const token = process.env.CONTACT_FORM_TOKEN;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        ...values,
        source: "shots-laundry-website",
        submittedAt: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error(`Enquiry delivery failed: ${response.status} ${response.statusText}`);
      return { status: "error" };
    }
    return { status: "success" };
  } catch (error) {
    console.error("Enquiry delivery failed:", error);
    return { status: "error" };
  }
}
