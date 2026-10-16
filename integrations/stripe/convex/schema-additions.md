# Stripe schema additions

Merge into `convex/schema.ts` when the Stripe integration installs:

```ts
purchases: defineTable({
  email: v.string(),
  stripeSessionId: v.string(),
  stripePaymentIntent: v.optional(v.string()),
  productName: v.string(),
  amountTotal: v.number(),
  currency: v.string(),
  status: v.union(v.literal("paid"), v.literal("refunded")),
  createdAt: v.number(),
})
  .index("by_session", ["stripeSessionId"])
  .index("by_email", ["email"]),
```
