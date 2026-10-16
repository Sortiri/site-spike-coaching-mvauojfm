import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { unstable_cache } from "next/cache";
import fallbackSpec from "../site.spec.json";

/**
 * Site spec types. Kept in sync with the control plane's
 * web/convex/lib/websiteSpec.ts (the validator there is the source of truth;
 * templates only ever render validated specs).
 */
export type WebsiteAction =
  | { type: "none" }
  | { type: "page"; pageId: string }
  | { type: "url"; url: string };

export type WebsiteSection = {
  id: string;
  type: string;
  [key: string]: unknown;
};

export type WebsitePage = {
  id: string;
  slug: string;
  title: string;
  seo: { title?: string; description?: string };
  sections: WebsiteSection[];
};

export type WebsiteSpec = {
  version: 1;
  brand: { name: string; tagline?: string; logoUrl?: string; accent: string };
  theme: {
    background: string;
    surface: string;
    text: string;
    muted: string;
    radius: number;
    font: "sans" | "display" | "serif";
  };
  nav: { label: string; pageId: string }[];
  pages: WebsitePage[];
  integrations: string[];
  footer: { text?: string; socials: { label: string; url: string }[] };
};

export const getPublishedRef = makeFunctionReference<"query">("site:getPublished");
export const getDraftRef = makeFunctionReference<"query">("site:getDraft");
export const submitLeadRef = makeFunctionReference<"mutation">("site:submitLead");

export function convexUrl(): string | null {
  return process.env.NEXT_PUBLIC_CONVEX_URL?.trim() || null;
}

async function fetchPublishedFromConvex(): Promise<WebsiteSpec | null> {
  const url = convexUrl();
  if (!url) return null;
  const client = new ConvexHttpClient(url);
  const doc = (await client.query(getPublishedRef, {})) as { spec: WebsiteSpec } | null;
  // Throw instead of returning null when a configured backend has no
  // published spec yet: unstable_cache must not remember "not seeded" for
  // an hour after provisioning seeds the deployment.
  if (!doc?.spec) throw new Error("Published site spec has not been seeded yet.");
  return doc.spec;
}

const cachedPublished = unstable_cache(fetchPublishedFromConvex, ["site-spec-v2"], {
  tags: ["site-spec"],
  revalidate: 3600,
});

/**
 * Published spec for rendering. Source order: the site's Convex deployment
 * (tag-cached, invalidated by /api/revalidate on publish), then the bundled
 * site.spec.json snapshot so the site still renders with no backend.
 */
export async function getPublishedSpec(): Promise<WebsiteSpec> {
  try {
    const fromConvex = await cachedPublished();
    return fromConvex ?? (fallbackSpec as WebsiteSpec);
  } catch {
    return fallbackSpec as WebsiteSpec;
  }
}

export function pageForSlug(spec: WebsiteSpec, slugParts: string[] | undefined): WebsitePage | null {
  const slug = slugParts && slugParts.length > 0 ? `/${slugParts.join("/")}` : "/";
  return spec.pages.find((page) => page.slug === slug) ?? null;
}

export function hrefForAction(spec: WebsiteSpec, action: WebsiteAction | undefined): string {
  if (!action) return "#";
  if (action.type === "url") return action.url;
  if (action.type === "page") {
    return spec.pages.find((page) => page.id === action.pageId)?.slug ?? "/";
  }
  return "#";
}
