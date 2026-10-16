"use client";

import { ChevronDown, Download, Maximize2 } from "lucide-react";
import { useState, type JSX } from "react";

// Same-origin files honour `download`; the Supabase storage needs its own query flag.
function storageDownload(url: string): string {
  if (!/^https?:\/\//.test(url)) return url;
  const target = new URL(url);
  target.searchParams.set("download", "");
  return target.toString();
}

/** A closed panel that shows the PDF once opened, with links to open it in full or download it. */
export function DocumentPreview({ title, url }: { title: string; url: string }): JSX.Element {
  const [opened, setOpened] = useState(false);
  const downloadHref = storageDownload(url);

  return (
    <details className="document-preview" onToggle={(event) => {
        // Phone browsers download a framed PDF instead of showing it: they only get the links.
        if (event.currentTarget.open && window.matchMedia("(min-width: 48rem)").matches) setOpened(true);
      }}>
      <summary>
        Afficher le document{" "}
        <span className="sr-only">{title}</span>
        <ChevronDown aria-hidden="true" size={18} />
      </summary>
      <div className="document-preview__body">
        {opened ? <iframe className="document-preview__frame" src={url} title={`${title} (PDF)`} /> : null}
        <p className="document-preview__phone">Sur téléphone, ouvrez le document en grand pour le lire.</p>
        <p className="document-preview__actions">
          <a className="button button--light" href={url} target="_blank" rel="noopener noreferrer">
            <Maximize2 aria-hidden="true" size={18} />
            Ouvrir en grand{" "}
            <span className="sr-only">{title} (nouvel onglet)</span>
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
