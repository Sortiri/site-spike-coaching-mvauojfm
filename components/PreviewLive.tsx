"use client";

import { ConvexProvider, ConvexReactClient, useQuery } from "convex/react";
import { useMemo } from "react";
import { SiteChrome, SitePage } from "./SiteRenderer";
import { getDraftRef, pageForSlug, type WebsiteSpec } from "../lib/spec";

/**
 * Tier-1 live preview: subscribes to the draft spec in the site's Convex
 * deployment. Every editor write re-renders this page in place — no build,
 * no reload. Falls back to the server-rendered published spec until the
 * first draft snapshot arrives (or if the token is invalid).
 */
function DraftView({
  token,
  slugParts,
  fallback,
}: {
  token: string;
  slugParts: string[] | undefined;
  fallback: WebsiteSpec;
}) {
  const draft = useQuery(getDraftRef, { previewToken: token }) as
    | { spec: WebsiteSpec; revision: number }
    | null
    | undefined;
  const spec = draft?.spec ?? fallback;
  const page = pageForSlug(spec, slugParts) ?? spec.pages[0]!;
  return (
    <SiteChrome spec={spec}>
      <div className="preview-bar" aria-hidden="true">
        Preview{draft ? ` · revision ${draft.revision}` : ""}
      </div>
      <SitePage spec={spec} page={page} />
    </SiteChrome>
  );
}

export function PreviewLive({
  token,
  slugParts,
  fallback,
}: {
  token: string;
  slugParts: string[] | undefined;
  fallback: WebsiteSpec;
}) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  const client = useMemo(() => (url ? new ConvexReactClient(url) : null), [url]);
  if (!client) {
    const page = pageForSlug(fallback, slugParts) ?? fallback.pages[0]!;
    return (
      <SiteChrome spec={fallback}>
        <SitePage spec={fallback} page={page} />
      </SiteChrome>
    );
  }
  return (
    <ConvexProvider client={client}>
      <DraftView token={token} slugParts={slugParts} fallback={fallback} />
    </ConvexProvider>
  );
}
