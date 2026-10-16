"use client";

import { ChevronDown, Download, Maximize2 } from "lucide-react";
import { useState, type JSX } from "react";

/** A closed panel that shows the PDF once opened, with links to open it in full or download it. */
export function DocumentPreview({ title, url }: { title: string; url: string }): JSX.Element {
  const [opened, setOpened] = useState(false);
  // Same-origin files honour `download`; the Supabase storage needs its own query flag.
  const downloadHref = /^https?:\/\//.test(url) ? `${url}?download=` : url;

  return (
    <details className="document-preview" onToggle={(event) => event.currentTarget.open && setOpened(true)}>
      <summary>
        Afficher le document
        <ChevronDown aria-hidden="true" size={18} />
      </summary>
      <div className="document-preview__body">
        {opened ? <iframe className="document-preview__frame" src={url} title={`${title} (PDF)`} /> : null}
        <p className="document-preview__phone">Sur téléphone, ouvrez le document en grand pour le lire.</p>
        <p className="document-preview__actions">
          <a className="button button--light" href={url} target="_blank" rel="noopener noreferrer">
            <Maximize2 aria-hidden="true" size={18} />
            Ouvrir en grand
            <span className="sr-only"> (nouvel onglet)</span>
          </a>
          <a className="button button--dark" href={downloadHref} download aria-label={`Télécharger ${title} (PDF)`}>
            <Download aria-hidden="true" size={18} />
            Télécharger
          </a>
        </p>
      </div>
    </details>
  );
}
