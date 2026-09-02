import "server-only";
import nodemailer from "nodemailer";

// Zoho Mail SMTP, used to relay lead-notification emails (Try Demo, and
// later Contact Us). Zoho requires an app-specific password for SMTP auth
// when two-factor auth is enabled on the mailbox — generate one from
// Zoho Mail Settings -> Security -> App Passwords, not the account's
// regular login password.

let cachedTransport: nodemailer.Transporter | null = null;

/** Null when SMTP isn't configured (e.g. local dev without .env values
 *  set) — callers should treat that as "email sending unavailable" rather
 *  than throwing, same graceful-degradation pattern used elsewhere
 *  (lib/whatsapp/config.ts, uploadTourImage's local-disk fallback). */
export function getZohoTransport(): nodemailer.Transporter | null {
  if (cachedTransport) return cachedTransport;

  const host = process.env.ZOHO_SMTP_HOST;
  const port = process.env.ZOHO_SMTP_PORT;
  const user = process.env.ZOHO_SMTP_USER;
  const password = process.env.ZOHO_SMTP_PASSWORD;
  if (!host || !port || !user || !password) return null;

  cachedTransport = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass: password },
  });
  return cachedTransport;
}

export function getZohoSenderAddress(): string | null {
  return process.env.ZOHO_SMTP_USER || null;
}
