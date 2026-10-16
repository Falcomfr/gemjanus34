import type { JSX } from "react";
import { DocumentPreview } from "@/components/content/document-preview";
import type { PublicDocument } from "@/content/types";
import { fr } from "@/lib/text/french";

type DocumentListProps = {
  documents: PublicDocument[];
};

export function DocumentList({ documents }: DocumentListProps): JSX.Element | null {
  if (documents.length === 0) {
    return null;
  }

  return (
    <section className="document-section" aria-labelledby="documents-title">
      <h2 id="documents-title">Documents à consulter</h2>
      <ul className="document-list">
        {documents.map((document) => (
          <li className="document-list__item" key={document.id}>
            <div>
              <h3>{fr(document.title)}</h3>
              <p>{fr(document.description)}</p>
            </div>
            <DocumentPreview title={document.title} url={document.downloadUrl} />
          </li>
        ))}
      </ul>
    </section>
  );
}
