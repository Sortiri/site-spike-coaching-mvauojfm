/**
 * Member accounts for this site (installed by the Sortiri "auth" catalog
 * entry; see integrations/README.md for the full install checklist).
 *
 * Schema: merge Convex Auth's tables into convex/schema.ts:
 *   import { authTables } from "@convex-dev/auth/server";
 *   export default defineSchema({ ...authTables, ...existingTables });
 * and add a `members` table for entitlements if Stripe is also installed:
 *   members: defineTable({ userId: v.id("users"), role: v.string() })
 *     .index("by_user", ["userId"])
 */
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const email = String(params.email ?? "").trim().toLowerCase();
        if (email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
          throw new Error("Enter a valid email.");
        }
        const name = typeof params.name === "string" ? params.name.trim().slice(0, 80) : "";
        return { email, ...(name ? { name } : {}) };
      },
    }),
  ],
});
