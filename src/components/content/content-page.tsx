import type { JSX } from "react";
import type { PublicDocument, PublicPage } from "@/content/types";
import { DocumentList } from "@/components/content/document-list";

type ContentPageProps = {
  page: PublicPage;
  documents?: PublicDocument[];
};

export function ContentPage({ page, documents = [] }: ContentPageProps): JSX.Element {
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
        {page.sections.map((section) => (
          <section className="content-page__section" key={section.id}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}
        <DocumentList documents={documents} />
      </div>
    </article>
  );
}
