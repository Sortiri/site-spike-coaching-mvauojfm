/**
 * Stripe webhook endpoint for this site (installed with the "stripe"
 * catalog entry). Verifies the Stripe signature with WebCrypto HMAC and
 * records completed checkouts. Register the deployed URL
 * (https://<deployment>.convex.site/stripe/webhook) in Stripe.
 *
 * If the site already has a convex/http.ts, merge this route into it.
 */
import { httpRouter } from "convex/server";
import { httpActionGeneric } from "convex/server";

const http = httpRouter();

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await globalThis.crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function verifyStripeSignature(request: Request, rawBody: string): Promise<boolean> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return false;
  const header = request.headers.get("stripe-signature") ?? "";
  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const [key, ...rest] = part.split("=");
      return [key?.trim(), rest.join("=")];
    }),
  );
  const timestamp = parts.t;
  const expected = parts.v1;
  if (!timestamp || !expected) return false;
  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (ageSeconds > 300) return false;
  return (await hmacHex(secret, `${timestamp}.${rawBody}`)) === expected;
}

http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: httpActionGeneric(async (_ctx, request) => {
    const rawBody = await request.text();
    if (!(await verifyStripeSignature(request, rawBody))) {
      return new Response("Invalid signature", { status: 400 });
    }
    const event = JSON.parse(rawBody) as {
      type?: string;
      data?: { object?: Record<string, unknown> };
    };
    if (event.type === "checkout.session.completed") {
      // Entitlement recording is wired to stripe:recordCheckoutCompleted by
      // the install commit once codegen has run for this deployment.
      console.log("checkout.session.completed", JSON.stringify(event.data?.object?.id ?? null));
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
