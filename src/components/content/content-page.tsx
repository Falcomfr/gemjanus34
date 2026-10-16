import { ArrowRight, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { JSX, ReactNode } from "react";
import type { PageSection, PublicDocument, PublicPage } from "@/content/types";
import { DocumentList } from "@/components/content/document-list";
import { RichBlocks } from "@/components/content/rich-blocks";
import { splitRichSections } from "@/lib/content/rich-sections";
import { fr } from "@/lib/text/french";

export type PageVisual = { src: string; alt: string; caption?: string; width: number; height: number };

type ContentPageProps = {
  page: PublicPage;
  documents?: PublicDocument[];
  children?: ReactNode;
  // Set by the route, so they survive any edit of the page content in the admin.
  eyebrow?: string;
  visual?: PageVisual;
};

function RichSectionsView({ content }: { content: NonNullable<PublicPage["content"]> }): JSX.Element {
  const { intro, sections } = splitRichSections(content);
  return (
    <>
      {intro.length > 0 ? <div className="content-page__intro"><RichBlocks blocks={intro} /></div> : null}
      {sections.map((section) => (
        <section className="content-page__section" key={section.id} aria-labelledby={`section-${section.id}`}>
          <h2 id={`section-${section.id}`}>{fr(section.title)}</h2>
          <div className="content-page__section-body">
            <RichBlocks blocks={section.blocks} />
          </div>
        </section>
      ))}
    </>
  );
}

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

export function ContentPage({ page, documents = [], children, eyebrow = page.eyebrow, visual }: ContentPageProps): JSX.Element {
  return (
    <article className="content-page">
      <header className="content-page__header">
        <div className={`content-container content-page__header-inner${visual ? " content-page__header-inner--visual" : ""}`}>
          <div>
            {eyebrow ? <p className="eyebrow">{fr(eyebrow)}</p> : null}
            <h1>{fr(page.title)}</h1>
            {page.introduction ? <p>{fr(page.introduction)}</p> : null}
          </div>
          {visual ? (
            <figure className="content-page__visual">
              <Image src={visual.src} alt={visual.alt} width={visual.width} height={visual.height} priority sizes="(min-width: 56rem) 24rem, 100vw" />
              {visual.caption ? <figcaption>{fr(visual.caption)}</figcaption> : null}
            </figure>
          ) : null}
        </div>
      </header>

      <div className="content-container content-page__body">
        {children}
        {page.content ? <RichSectionsView content={page.content} /> : null}
        {page.content ? null : page.sections.map((section) => {
          const List = section.ordered ? "ol" : "ul";
          return (
            <section className="content-page__section" key={section.id} aria-labelledby={`section-${section.id}`}>
              <h2 id={`section-${section.id}`}>{fr(section.title)}</h2>
              <div className="content-page__section-body">
                {section.body
                  .split("\n\n")
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p key={index}>{fr(paragraph)}</p>
                  ))}
                {section.items?.length ? (
                  <List className={section.ordered ? "content-list content-list--steps" : "content-list"}>
                    {section.items.map((item, index) => (
                      <li key={index}>{fr(item)}</li>
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
