// Minimal PayPal REST (v2 Orders API) client — no @paypal/* package needed.
// Docs: https://developer.paypal.com/docs/api/orders/v2/

const PAYPAL_ENV = process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";
const BASE_URL =
  PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  // Vercel env vars pasted from PayPal's dashboard commonly pick up a
  // trailing newline or space, which silently breaks Basic auth (the
  // credential no longer matches what PayPal has on file) and surfaces
  // only as a generic "invalid_client" 401 with no hint that whitespace
  // was the cause. Trimming only handles the edges — if the value was
  // copied from a source that line-wraps (a note, a doc, a chat message),
  // a newline or space can end up in the *middle* of the string too, and
  // that's invisible when eyeballing the credential. Strip ALL whitespace
  // (PayPal client ids/secrets never legitimately contain any) and warn
  // when we had to, so this whole class of failure surfaces immediately
  // in the logs instead of looking like a wrong/expired credential.
  const trimmed = v.trim();
  const sanitized = trimmed.replace(/\s+/g, "");
  if (sanitized !== trimmed) {
    console.error(
      `[paypal] ${name} contained internal whitespace/newline that was stripped — the value was likely copied from a source that line-wraps text. Re-copy it directly from the PayPal dashboard into Vercel.`
    );
  }
  return sanitized;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const clientId = requireEnv("PAYPAL_CLIENT_ID");
  const secret = requireEnv("PAYPAL_CLIENT_SECRET");
  const basic = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) {
    // Masked diagnostics only — never the secret. This tells us, from the
    // Vercel logs alone, exactly which client id (partial) and which
    // PAYPAL_ENV was actually used for this failed auth attempt, so a
    // sandbox/live credential mismatch or wrong-app credential is
    // immediately visible without exposing anything sensitive.
    console.error(
      `[paypal] auth failed against ${PAYPAL_ENV} (${BASE_URL}) using client id "${clientId.slice(0, 6)}...${clientId.slice(-4)}" (len ${clientId.length}), secret len ${secret.length}`
    );
    throw new Error(`PayPal auth failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.value;
}

export async function paypalCreateOrder(params: {
  amountCents: number;
  currency?: string;
  description: string;
  referenceId: string; // our payments.id, so we can match it on capture/webhook
}): Promise<{ id: string }> {
  const token = await getAccessToken();
  const value = (params.amountCents / 100).toFixed(2);

  const res = await fetch(`${BASE_URL}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: params.referenceId,
          description: params.description.slice(0, 127),
          amount: {
            currency_code: params.currency ?? "USD",
            value,
          },
        },
      ],
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`PayPal create order failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

export async function paypalCaptureOrder(orderId: string): Promise<{
  status: string;
  id: string;
  purchase_units?: Array<{
    reference_id?: string;
    payments?: { captures?: Array<{ id: string; status: string }> };
  }>;
}> {
  const token = await getAccessToken();

  const res = await fetch(`${BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`PayPal capture failed: ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

// Used by the webhook route to confirm a webhook body genuinely came from PayPal
// before trusting it. https://developer.paypal.com/api/rest/webhooks/rest/
export async function paypalVerifyWebhookSignature(params: {
  headers: Headers;
  body: string;
}): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;

  const token = await getAccessToken();

  const res = await fetch(`${BASE_URL}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transmission_id: params.headers.get("paypal-transmission-id"),
      transmission_time: params.headers.get("paypal-transmission-time"),
      cert_url: params.headers.get("paypal-cert-url"),
      auth_algo: params.headers.get("paypal-auth-algo"),
      transmission_sig: params.headers.get("paypal-transmission-sig"),
      webhook_id: webhookId,
      webhook_event: JSON.parse(params.body),
    }),
    cache: "no-store",
  });

  if (!res.ok) return false;
  const data = await res.json();
  return data.verification_status === "SUCCESS";
}
