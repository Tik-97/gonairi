"use server";

import { z } from "zod";
import { getZohoTransport, getZohoSenderAddress } from "@/lib/email/zoho-transport";
import { logError } from "@/lib/log";

// Public, unauthenticated form (app/(marketing)) — re-validate everything
// server-side rather than trusting the client's `required` attributes,
// since a Server Action can be called directly with arbitrary FormData.
const TryDemoSchema = z.object({
  agencyName: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(50),
  employees: z.string().trim().min(1).max(20),
  message: z.string().trim().max(2000),
});

export interface TryDemoState {
  success: boolean;
  error?: string;
}

export async function submitTryDemoRequest(_prevState: TryDemoState | undefined, formData: FormData): Promise<TryDemoState> {
  const parsed = TryDemoSchema.safeParse({
    agencyName: formData.get("agencyName"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    employees: formData.get("employees"),
    message: formData.get("message") ?? "",
  });
  if (!parsed.success) {
    return { success: false, error: "Please fill in the required fields correctly." };
  }
  const { agencyName, email, phone, employees, message } = parsed.data;

  const transport = getZohoTransport();
  const from = getZohoSenderAddress();
  const to = process.env.TRY_DEMO_LEAD_EMAIL_TO;
  if (!transport || !from || !to) {
    logError("submitTryDemoRequest", new Error("Zoho SMTP is not configured (ZOHO_SMTP_* / TRY_DEMO_LEAD_EMAIL_TO)."));
    return { success: false, error: "Something went wrong. Please try again later." };
  }

  try {
    await transport.sendMail({
      from,
      to,
      replyTo: email,
      subject: `New Try Demo request — ${agencyName}`,
      text: [
        `Agency: ${agencyName}`,
        `Email: ${email}`,
        `Phone: ${phone || "-"}`,
        `Employees: ${employees}`,
        "",
        "What they're looking for:",
        message || "-",
      ].join("\n"),
    });
    return { success: true };
  } catch (error) {
    logError("submitTryDemoRequest", error);
    return { success: false, error: "Something went wrong sending your request. Please try again later." };
  }
}
