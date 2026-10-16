import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/**
 * Tier-2 publish hook: the Sortiri control plane calls this after promoting
 * draft -> published in the site backend. Invalidating the spec tag makes
 * the next request regenerate fresh static HTML; no rebuild involved.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const provided = request.headers.get("x-revalidate-secret") ?? "";
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  revalidateTag("site-spec", { expire: 0 });
  revalidatePath("/", "layout");
  return NextResponse.json({ revalidated: true });
}
