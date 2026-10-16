import Link from "next/link";
import { LeadForm } from "./LeadForm";
import { hrefForAction, type WebsiteAction, type WebsitePage, type WebsiteSpec } from "../lib/spec";

function s(section: Record<string, unknown>, key: string): string {
  const value = section[key];
  return typeof value === "string" ? value : "";
}

function items(section: Record<string, unknown>): Record<string, unknown>[] {
  const raw = section.items ?? section.tiers;
  return Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [];
}

function CtaLink({ spec, cta }: { spec: WebsiteSpec; cta: unknown }) {
  if (!cta || typeof cta !== "object") return null;
  const c = cta as { label?: string; action?: WebsiteAction };
  if (!c.label) return null;
  const href = hrefForAction(spec, c.action);
  return href.startsWith("http") ? (
    <a className="btn" href={href}>{c.label}</a>
  ) : (
    <Link className="btn" href={href}>{c.label}</Link>
  );
}

function Section({ spec, section, pageSlug }: { spec: WebsiteSpec; section: Record<string, unknown>; pageSlug: string }) {
  switch (section.type) {
    case "hero":
      return (
        <section className="hero">
          {s(section, "eyebrow") ? <p className="eyebrow">{s(section, "eyebrow")}</p> : null}
          <h1>{s(section, "title")}</h1>
          {s(section, "body") ? <p className="hero-body">{s(section, "body")}</p> : null}
          <CtaLink spec={spec} cta={section.cta} />
          {s(section, "imageUrl") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="hero-media" src={s(section, "imageUrl")} alt="" />
          ) : null}
        </section>
      );
    case "heading":
      return <h2 className="section-title">{s(section, "text")}</h2>;
    case "text":
      return <p className="prose">{s(section, "text")}</p>;
    case "image":
      // eslint-disable-next-line @next/next/no-img-element
      return <img className="media" src={s(section, "url")} alt={s(section, "alt")} />;
    case "features":
      return (
        <section className="block">
          {s(section, "title") ? <h2 className="section-title">{s(section, "title")}</h2> : null}
          <div className="cards">
            {items(section).map((item, i) => (
              <article className="card" key={i}>
                <h3>{s(item, "title")}</h3>
                <p>{s(item, "body")}</p>
              </article>
            ))}
          </div>
        </section>
      );
    case "programs":
      return (
        <section className="block">
          {s(section, "title") ? <h2 className="section-title">{s(section, "title")}</h2> : null}
          <div className="cards">
            {items(section).map((item, i) => (
              <article className="card" key={i}>
                <h3>{s(item, "name")}</h3>
                <p>{s(item, "blurb")}</p>
                {s(item, "priceLabel") ? <p className="price">{s(item, "priceLabel")}</p> : null}
              </article>
            ))}
          </div>
        </section>
      );
    case "pricing":
      return (
        <section className="block">
          {s(section, "title") ? <h2 className="section-title">{s(section, "title")}</h2> : null}
          <div className="cards">
            {items(section).map((tier, i) => (
              <article className="card" key={i}>
                <h3>{s(tier, "name")}</h3>
                <p className="price">{s(tier, "priceLabel")}</p>
                <ul>
                  {(Array.isArray(tier.features) ? (tier.features as string[]) : []).map((f, j) => (
                    <li key={j}>{f}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      );
    case "testimonials":
      return (
        <section className="block">
          {s(section, "title") ? <h2 className="section-title">{s(section, "title")}</h2> : null}
          <div className="cards">
            {items(section).map((item, i) => (
              <figure className="card" key={i}>
                <blockquote>{s(item, "quote")}</blockquote>
                <figcaption>
                  {s(item, "author")}
                  {s(item, "role") ? ` — ${s(item, "role")}` : ""}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      );
    case "faq":
      return (
        <section className="block">
          {s(section, "title") ? <h2 className="section-title">{s(section, "title")}</h2> : null}
          {items(section).map((item, i) => (
            <details className="faq" key={i}>
              <summary>{s(item, "question")}</summary>
              <p>{s(item, "answer")}</p>
            </details>
          ))}
        </section>
      );
    case "stats":
      return (
        <section className="stats">
          {items(section).map((item, i) => (
            <div key={i}>
              <strong>{s(item, "value")}</strong>
              <span>{s(item, "label")}</span>
            </div>
          ))}
        </section>
      );
    case "leadForm":
      return (
        <section className="block">
          <h2 className="section-title">{s(section, "title")}</h2>
          {s(section, "body") ? <p className="prose">{s(section, "body")}</p> : null}
          <LeadForm pageSlug={pageSlug} submitLabel={s(section, "submitLabel") || "Send"} />
        </section>
      );
    case "cta":
      return (
        <section className="cta">
          <h2>{s(section, "title")}</h2>
          {s(section, "body") ? <p>{s(section, "body")}</p> : null}
          <CtaLink spec={spec} cta={section.cta} />
        </section>
      );
    case "spacer":
      return <div style={{ height: typeof section.size === "number" ? section.size : 24 }} />;
    default:
      return null;
  }
}

export function SitePage({ spec, page }: { spec: WebsiteSpec; page: WebsitePage }) {
  return (
    <main className="wrap">
      {page.sections.map((section) => (
        <Section key={section.id} spec={spec} section={section} pageSlug={page.slug} />
      ))}
    </main>
  );
}

export function SiteChrome({ spec, children }: { spec: WebsiteSpec; children: React.ReactNode }) {
  return (
    <>
      <header className="site-header wrap">
        <Link className="brand" href="/">
          {spec.brand.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={spec.brand.logoUrl} alt="" width={30} height={30} />
          ) : null}
          <span>{spec.brand.name}</span>
        </Link>
        <nav>
          {spec.nav.map((item) => {
            const slug = spec.pages.find((page) => page.id === item.pageId)?.slug ?? "/";
            return (
              <Link key={`${item.pageId}-${item.label}`} href={slug}>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      {children}
      <footer className="site-footer wrap">
        <p>{spec.footer.text ?? spec.brand.name}</p>
        <nav>
          {spec.footer.socials.map((social) => (
            <a key={social.url} href={social.url}>
              {social.label}
            </a>
          ))}
        </nav>
      </footer>
    </>
  );
}
