# Integration payloads

Files under `integrations/` are NOT part of the running template. They are
the payloads the Sortiri integration catalog copies into a generated site's
repo when a coach installs that integration (a tier-3 change: one commit,
then the normal frontend build + `convex deploy` pipeline).

| Integration | Copied to | Also required |
| --- | --- | --- |
| `auth/` | `convex/auth.ts`, `convex/auth.config.ts`, `app/(auth)/` | Add deps `@convex-dev/auth` and `@auth/core`; run `npx @convex-dev/auth` env setup (`JWT_PRIVATE_KEY`, `JWKS`, `SITE_URL`); extend `convex/schema.ts` with the auth tables per `convex/auth.ts` header. |
| `stripe/` | `convex/stripe.ts`, `convex/http.ts` | Convex env `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CONNECTED_ACCOUNT_ID`; Vercel env `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`; add the `purchases` table from `stripe/convex/schema-additions.md`; register the webhook URL (`https://<deployment>.convex.site/stripe/webhook`) in Stripe. |
| `forms/` | — (built into the template) | Optional Convex env `LEAD_NOTIFY_EMAIL`. |

The catalog manifest that drives installs lives in the Sortiri control
plane at `web/convex/lib/siteIntegrations.ts`; keep paths in sync.
