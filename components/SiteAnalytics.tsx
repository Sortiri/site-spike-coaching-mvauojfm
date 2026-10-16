"use client";

import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { useEffect } from "react";

/**
 * First-party analytics: captures into Sortiri's PostHog project with this
 * site's `site_id` as a super-property, so the coach's native dashboard can
 * show only their traffic. Inert unless both env vars are present (they are
 * set by provisioning) and respects Do Not Track.
 */
let started = false;

export function SiteAnalytics() {
  const pathname = usePathname();
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const siteId = process.env.NEXT_PUBLIC_SORTIRI_SITE_ID;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

  useEffect(() => {
    if (!token || !siteId) return;
    if (typeof navigator !== "undefined" && navigator.doNotTrack === "1") return;
    if (!started) {
      started = true;
      posthog.init(token, { api_host: host, capture_pageview: false, persistence: "localStorage" });
      posthog.register({ site_id: siteId });
    }
    posthog.capture("$pageview", { $current_url: window.location.href, $pathname: pathname });
  }, [pathname, token, siteId, host]);

  return null;
}
