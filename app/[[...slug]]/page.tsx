import { notFound } from "next/navigation";
import { PreviewLive } from "../../components/PreviewLive";
import { SiteChrome, SitePage } from "../../components/SiteRenderer";
import { getPublishedSpec, pageForSlug } from "../../lib/spec";

export const revalidate = 3600;

export async function generateStaticParams() {
  const spec = await getPublishedSpec();
  return spec.pages.map((page) => ({
    slug: page.slug === "/" ? [] : page.slug.replace(/^\//, "").split("/"),
  }));
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const spec = await getPublishedSpec();

  // Draft preview: same deployment, live subscription, no separate build.
  if (preview) {
    return <PreviewLive token={preview} slugParts={slug} fallback={spec} />;
  }

  const page = pageForSlug(spec, slug);
  if (!page) notFound();
  return (
    <SiteChrome spec={spec}>
      <SitePage spec={spec} page={page} />
    </SiteChrome>
  );
}
