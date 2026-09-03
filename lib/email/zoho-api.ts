import "server-only";

interface ZohoEmailMessage {
  to: string;
  subject: string;
  text: string;
}

interface ZohoTokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
}

interface CachedToken {
  value: string;
  expiresAt: number;
}

const HTTP_TIMEOUT_MS = 15_000;
const TOKEN_EXPIRY_MARGIN_MS = 60_000;

let cachedToken: CachedToken | null = null;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function httpsUrl(name: string, fallback: string): URL {
  const url = new URL(process.env[name] || fallback);
  if (url.protocol !== "https:") throw new Error(`${name} must use HTTPS.`);
  return url;
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - TOKEN_EXPIRY_MARGIN_MS) {
    return cachedToken.value;
  }

  const tokenUrl = httpsUrl("ZOHO_ACCOUNTS_URL", "https://accounts.zoho.eu");
  tokenUrl.pathname = `${tokenUrl.pathname.replace(/\/$/, "")}/oauth/v2/token`;
  tokenUrl.search = new URLSearchParams({
    refresh_token: requiredEnv("ZOHO_REFRESH_TOKEN"),
    grant_type: "refresh_token",
    client_id: requiredEnv("ZOHO_CLIENT_ID"),
    client_secret: requiredEnv("ZOHO_CLIENT_SECRET"),
  }).toString();

  const response = await fetch(tokenUrl, {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
  });
  const body = (await response.json()) as ZohoTokenResponse;

  if (!response.ok || !body.access_token) {
    throw new Error(`Zoho OAuth returned ${response.status}: ${body.error || "missing access token"}`);
  }

  cachedToken = {
    value: body.access_token,
    expiresAt: Date.now() + (body.expires_in || 3_600) * 1_000,
  };
  return cachedToken.value;
}

/** Send mail from the existing Zoho mailbox through HTTPS instead of SMTP. */
export async function sendZohoEmail(message: ZohoEmailMessage): Promise<void> {
  const accessToken = await getAccessToken();
  const accountId = encodeURIComponent(requiredEnv("ZOHO_ACCOUNT_ID"));
  const mailUrl = httpsUrl("ZOHO_MAIL_API_URL", "https://mail.zoho.eu/api");
  mailUrl.pathname = `${mailUrl.pathname.replace(/\/$/, "")}/accounts/${accountId}/messages`;

  const response = await fetch(mailUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fromAddress: requiredEnv("ZOHO_FROM_EMAIL"),
      toAddress: message.to,
      subject: message.subject,
      content: message.text,
      mailFormat: "plaintext",
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
  });

  if (!response.ok) {
    const details = (await response.text()).slice(0, 1_000);
    throw new Error(`Zoho Mail API returned ${response.status}: ${details}`);
  }
}
