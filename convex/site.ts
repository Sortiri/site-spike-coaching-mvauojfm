import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

/**
 * Spec reads/writes for one generated site.
 *
 * Generic constructors are used deliberately: the template has no checked-in
 * codegen, so `convex deploy` works from a fresh clone in CI.
 *
 * Draft reads require the preview token issued by the Sortiri control plane
 * (stored hashed in siteSettings as `previewTokenHash`, compared against a
 * SHA-256 of the presented token). Writes require the editor secret, which
 * only the Sortiri control plane holds.
 */

async function sha256Hex(value: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const getPublished = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const doc = await ctx.db
      .query("siteSpecs")
      .withIndex("by_key", (q) => q.eq("key", "published"))
      .unique();
    return doc ? { spec: doc.spec, revision: doc.revision, updatedAt: doc.updatedAt } : null;
  },
});

export const getDraft = queryGeneric({
  args: { previewToken: v.string() },
  handler: async (ctx, { previewToken }) => {
    if (!previewToken) return null;
    const setting = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", "previewTokenHash"))
      .unique();
    if (!setting || typeof setting.value !== "string") return null;
    if ((await sha256Hex(previewToken)) !== setting.value) return null;
    const doc = await ctx.db
      .query("siteSpecs")
      .withIndex("by_key", (q) => q.eq("key", "draft"))
      .unique();
    return doc ? { spec: doc.spec, revision: doc.revision, updatedAt: doc.updatedAt } : null;
  },
});

export const setSpec = mutationGeneric({
  args: {
    editorSecret: v.string(),
    key: v.union(v.literal("draft"), v.literal("published")),
    spec: v.any(),
    revision: v.number(),
  },
  handler: async (ctx, { editorSecret, key, spec, revision }) => {
    const expected = process.env.SITE_EDITOR_SECRET;
    if (!expected || editorSecret !== expected) throw new Error("Not authorized");
    const existing = await ctx.db
      .query("siteSpecs")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    const now = Date.now();
    if (existing) {
      if (revision < (existing.revision as number)) return { ok: true as const, stale: true as const };
      await ctx.db.patch(existing._id, { spec, revision, updatedAt: now });
    } else {
      await ctx.db.insert("siteSpecs", { key, spec, revision, updatedAt: now });
    }
    return { ok: true as const, stale: false as const };
  },
});

export const submitLead = mutationGeneric({
  args: {
    name: v.string(),
    email: v.string(),
    message: v.string(),
    pageSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim().slice(0, 120);
    const email = args.email.trim().toLowerCase().slice(0, 254);
    const message = args.message.trim().slice(0, 4000);
    if (name.length < 2) throw new Error("Enter your name.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Enter a valid email.");
    if (message.length < 2) throw new Error("Enter a message.");
    await ctx.db.insert("leads", {
      name,
      email,
      message,
      pageSlug: args.pageSlug.slice(0, 120),
      createdAt: Date.now(),
    });
    return { ok: true as const };
  },
});
