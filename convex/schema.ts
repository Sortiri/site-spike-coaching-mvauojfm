import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Per-site backend. The site spec lives here as draft/published documents:
 * content edits are data writes, so previews update through subscriptions
 * with no build. Integration tables (leads, members, orders) join this
 * schema as catalog entries are installed.
 */
export default defineSchema({
  siteSpecs: defineTable({
    key: v.union(v.literal("draft"), v.literal("published")),
    spec: v.any(),
    revision: v.number(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
  leads: defineTable({
    name: v.string(),
    email: v.string(),
    message: v.string(),
    pageSlug: v.string(),
    createdAt: v.number(),
  }).index("by_created", ["createdAt"]),
  siteSettings: defineTable({
    key: v.string(),
    value: v.any(),
  }).index("by_key", ["key"]),
});
