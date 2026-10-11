import { Download } from "lucide-react";
import type { JSX } from "react";
import type { PublicDocument } from "@/content/types";

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
              <h3>{document.title}</h3>
              <p>{document.description}</p>
            </div>
            <a className="button button--dark" href={document.downloadUrl}>
              <Download aria-hidden="true" size={20} />
              Télécharger {document.title}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
