import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteAnalytics } from "../components/SiteAnalytics";
import { getPublishedSpec } from "../lib/spec";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const spec = await getPublishedSpec();
  const home = spec.pages.find((page) => page.slug === "/") ?? spec.pages[0];
  return {
    title: home?.seo.title ?? spec.brand.name,
    description: home?.seo.description ?? spec.brand.tagline ?? undefined,
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const spec = await getPublishedSpec();
  const theme = spec.theme;
  const style = {
    "--bg": theme.background,
    "--surface": theme.surface,
    "--ink": theme.text,
    "--muted": theme.muted,
    "--accent": spec.brand.accent,
    "--radius": `${theme.radius}px`,
  } as React.CSSProperties;
  return (
    <html lang="en" data-font={theme.font}>
      <body style={style}>
        {children}
        <SiteAnalytics />
      </body>
    </html>
  );
}
