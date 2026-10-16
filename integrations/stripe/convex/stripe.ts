/**
 * Stripe Checkout for this site (installed by the Sortiri "stripe" catalog
 * entry). Charges run on the coach's connected Stripe account; Sortiri's
 * platform fee is taken as the Connect application fee. No Stripe SDK:
 * plain HTTPS calls keep the Convex bundle small.
 */
import { actionGeneric, mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const PLATFORM_FEE_BPS = 100; // 1%, matching Sortiri's published pricing.

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error("Payments are not configured for this site yet.");
  return value;
}

export const createCheckout = actionGeneric({
  args: {
    productName: v.string(),
    amountCents: v.number(),
    currency: v.optional(v.string()),
    successUrl: v.string(),
    cancelUrl: v.string(),
    customerEmail: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const secretKey = requiredEnv("STRIPE_SECRET_KEY");
    const accountId = requiredEnv("STRIPE_CONNECTED_ACCOUNT_ID");
    const amount = Math.max(50, Math.trunc(args.amountCents));
    const fee = Math.round((amount * PLATFORM_FEE_BPS) / 10_000);
    const form = new URLSearchParams({
      mode: "payment",
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": (args.currency ?? "usd").toLowerCase(),
      "line_items[0][price_data][unit_amount]": String(amount),
      "line_items[0][price_data][product_data][name]": args.productName.slice(0, 120),
      "payment_intent_data[application_fee_amount]": String(fee),
    });
    if (args.customerEmail) form.set("customer_email", args.customerEmail.slice(0, 254));
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Stripe-Account": accountId,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    const body = (await response.json()) as { url?: string; error?: { message?: string } };
    if (!response.ok || !body.url) {
      throw new Error(body.error?.message ?? "Checkout could not be started.");
    }
    return { url: body.url };
  },
});

/** Recorded by the webhook in http.ts after signature verification. */
export const recordCheckoutCompleted = mutationGeneric({
  args: {
    email: v.string(),
    stripeSessionId: v.string(),
    stripePaymentIntent: v.optional(v.string()),
    productName: v.string(),
    amountTotal: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("purchases")
      .withIndex("by_session", (q) => q.eq("stripeSessionId", args.stripeSessionId))
      .unique();
    if (existing) return { ok: true as const, duplicate: true as const };
    await ctx.db.insert("purchases", { ...args, status: "paid", createdAt: Date.now() });
    return { ok: true as const, duplicate: false as const };
  },
});

export const myPurchases = queryGeneric({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    // Members only ever see their own purchases.
    if (identity.email?.toLowerCase() !== email.trim().toLowerCase()) return [];
    return await ctx.db
      .query("purchases")
      .withIndex("by_email", (q) => q.eq("email", email.trim().toLowerCase()))
      .order("desc")
      .take(50);
  },
});
