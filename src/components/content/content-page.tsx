import { ArrowRight, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { JSX, ReactNode } from "react";
import type { PageSection, PublicDocument, PublicPage } from "@/content/types";
import { DocumentList } from "@/components/content/document-list";

// French typography: a narrow no-break space keeps « ? ! : ; » on the line of the previous word.
function fr(text: string): string {
  return text.replace(/ ([?!:;»])/g, "\u202f$1").replace(/« /g, "«\u202f");
}

type ContentPageProps = {
  page: PublicPage;
  documents?: PublicDocument[];
  children?: ReactNode;
};

function SectionLinks({ links }: { links: NonNullable<PageSection["links"]> }): JSX.Element {
  return (
    <ul className="link-list">
      {links.map((link) => {
        const external = /^https?:\/\//.test(link.href);
        return (
          <li key={link.href}>
            {external ? (
              <a className="text-link" href={link.href} target="_blank" rel="noopener noreferrer">
                {fr(link.label)}
                <ExternalLink aria-hidden="true" size={18} />
                <span className="sr-only"> (nouvel onglet)</span>
              </a>
            ) : (
              <Link className="text-link" href={link.href}>
                {fr(link.label)}
                <ArrowRight aria-hidden="true" size={18} />
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function ContentPage({ page, documents = [], children }: ContentPageProps): JSX.Element {
  return (
    <article className="content-page">
      <header className="content-page__header">
        <div className="content-container content-page__header-inner">
          {page.eyebrow ? <p className="eyebrow">{fr(page.eyebrow)}</p> : null}
          <h1>{fr(page.title)}</h1>
          <p>{fr(page.introduction)}</p>
        </div>
      </header>

      <div className="content-container content-page__body">
        {children}
        {page.sections.map((section) => {
          const List = section.ordered ? "ol" : "ul";
          return (
            <section className="content-page__section" key={section.id} aria-labelledby={`section-${section.id}`}>
              <h2 id={`section-${section.id}`}>{fr(section.title)}</h2>
              <div className="content-page__section-body">
                {section.body
                  .split("\n\n")
                  .filter(Boolean)
                  .map((paragraph) => (
                    <p key={paragraph}>{fr(paragraph)}</p>
                  ))}
                {section.items?.length ? (
                  <List className={section.ordered ? "content-list content-list--steps" : "content-list"}>
                    {section.items.map((item) => (
                      <li key={item}>{fr(item)}</li>
                    ))}
                  </List>
                ) : null}
                {section.links?.length ? <SectionLinks links={section.links} /> : null}
                {section.image ? (
                  <figure className="content-figure">
                    <Image
                      src={section.image.src}
                      alt={section.image.alt}
                      width={section.image.width}
                      height={section.image.height}
                    />
                    <figcaption>{fr(section.image.caption)}</figcaption>
                  </figure>
                ) : null}
              </div>
            </section>
          );
        })}
        <DocumentList documents={documents} />
      </div>
    </article>
  );
}
