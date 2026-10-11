import { CalendarDays, Download } from "lucide-react";
import Link from "next/link";
import type { JSX } from "react";
import type { PublicDocument } from "@/content/types";

type CurrentPlanningProps = {
  document?: PublicDocument;
};

export function CurrentPlanning({ document }: CurrentPlanningProps): JSX.Element {
  return (
    <section className="planning-band" aria-labelledby="planning-title">
      <div className="content-container planning-band__inner">
        <CalendarDays className="planning-band__icon" aria-hidden="true" size={36} />
        <div className="planning-band__content">
          <p className="eyebrow eyebrow--dark">Activités</p>
          <h2 id="planning-title">Dernier planning importé</h2>
          <p>
            Ce document provient de l&apos;ancien site. Il reste disponible à titre d&apos;archive,
            dans l&apos;attente d&apos;une mise à jour éditoriale.
          </p>
        </div>
        {document ? (
          <Link className="button button--dark" href={document.downloadUrl}>
            Consulter le planning importé
            <Download aria-hidden="true" size={20} />
          </Link>
        ) : (
          <p className="planning-band__unavailable">Planning temporairement indisponible</p>
        )}
      </div>
    </section>
  );
}
