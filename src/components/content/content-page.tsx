import { ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { JSX, ReactNode } from "react";
import type { PageSection, PublicDocument, PublicPage } from "@/content/types";
import { DocumentList } from "@/components/content/document-list";

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
                {link.label}
                <ExternalLink aria-hidden="true" size={18} />
                <span className="sr-only"> (nouvel onglet)</span>
              </a>
            ) : (
              <Link className="text-link" href={link.href}>
                {link.label}
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
          {page.eyebrow ? <p className="eyebrow">{page.eyebrow}</p> : null}
          <h1>{page.title}</h1>
          <p>{page.introduction}</p>
        </div>
      </header>

      <div className="content-container content-page__body">
        {children}
        {page.sections.map((section) => {
          const List = section.ordered ? "ol" : "ul";
          return (
            <section className="content-page__section" key={section.id} aria-labelledby={`section-${section.id}`}>
              <h2 id={`section-${section.id}`}>{section.title}</h2>
              <div className="content-page__section-body">
                {section.body
                  .split("\n\n")
                  .filter(Boolean)
                  .map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                {section.items?.length ? (
                  <List className={section.ordered ? "content-list content-list--steps" : "content-list"}>
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </List>
                ) : null}
                {section.links?.length ? <SectionLinks links={section.links} /> : null}
              </div>
            </section>
          );
        })}
        <DocumentList documents={documents} />
      </div>
    </article>
  );
}
