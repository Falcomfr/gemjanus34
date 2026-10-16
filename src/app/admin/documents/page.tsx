import { ExternalLink } from "lucide-react";
import { DeleteDocumentButton } from "@/components/admin/delete-document-button";
import { DocumentUploadForm } from "@/components/admin/document-upload-form";
import type { DocumentCategory } from "@/content/types";
import { documentCategories } from "@/lib/admin/document-input";
import { requireProfile } from "@/lib/auth/require-profile";
import { createServerClient } from "@/lib/supabase/server";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" });

export default async function AdminDocumentsPage() {
  await requireProfile();
  const supabase = await createServerClient();
  const { data: documents, error } = await supabase
    .from("documents")
    .select("id, title, description, category, document_date, url")
    .order("category")
    .order("document_date", { ascending: false });

  return (
    <div className="admin-pages-index">
      <header className="admin-page-header">
        <p className="eyebrow eyebrow--dark">Contenu</p>
        <h1>Documents</h1>
        <p>
          Les PDF proposés sur le site : statuts, comptes rendus, documents d’information. Le
          planning des activités se modifie dans la rubrique Planning.
        </p>
      </header>

      <section className="admin-form-section admin-documents__upload" aria-labelledby="upload-title">
        <div className="admin-form-section__heading">
          <h2 id="upload-title">Mettre en ligne un document</h2>
        </div>
        <DocumentUploadForm />
      </section>

      {error ? <p className="form-status form-status--error">Les documents n’ont pas pu être chargés.</p> : null}

      {(Object.keys(documentCategories) as DocumentCategory[]).map((category) => {
        const items = (documents ?? []).filter((document) => document.category === category);
        return (
          <section className="admin-documents__group" key={category} aria-labelledby={`documents-${category}`}>
            <h2 id={`documents-${category}`}>{documentCategories[category]}</h2>
            {items.length === 0 ? (
              <p className="admin-empty-state">Aucun document dans cette catégorie.</p>
            ) : (
              <ul className="admin-documents__list">
                {items.map((document) => (
                  <li key={document.id}>
                    <div>
                      <strong>{document.title}</strong>
                      <span>
                        {dateFormat.format(new Date(`${document.document_date}T00:00:00Z`))} · {document.description}
                      </span>
                    </div>
                    <a className="admin-icon-button" href={document.url} target="_blank" rel="noopener noreferrer" aria-label={`Ouvrir ${document.title}`} title="Ouvrir">
                      <ExternalLink aria-hidden="true" size={18} />
                    </a>
                    <DeleteDocumentButton id={document.id} title={document.title} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
