import { CalendarDays, FileText, Phone } from "lucide-react";
import type { JSX } from "react";
import { contact } from "@/content/contact";
import type { PublicDocument } from "@/content/types";
import { formatPublicDate } from "@/lib/date/public-date";

type CurrentPlanningProps = {
  document?: PublicDocument;
};

export function CurrentPlanning({ document }: CurrentPlanningProps): JSX.Element {
  return (
    <section className="planning-band" id="planning" aria-labelledby="planning-title">
      <div className="content-container planning-band__inner">
        <CalendarDays className="planning-band__icon" aria-hidden="true" size={40} />
        <div className="planning-band__content">
          <p className="eyebrow eyebrow--dark">Chaque semaine au GEM</p>
          <h2 id="planning-title">Le planning des activités</h2>
          {document ? (
            <p>
              En vigueur depuis le {formatPublicDate(document.updatedAt)}. Ateliers, sorties et temps
              collectifs y sont indiqués jour par jour. En cas de doute, appelez l&apos;équipe.
            </p>
          ) : (
            <p>
              Le planning est disponible auprès de l&apos;équipe, qui vous présente volontiers les
              activités de la semaine.
            </p>
          )}
        </div>
        {document ? (
          <a className="button button--dark" href={document.downloadUrl}>
            <FileText aria-hidden="true" size={20} />
            Consulter le planning (PDF)
          </a>
        ) : (
          <a className="button button--dark" href={contact.phoneHref}>
            <Phone aria-hidden="true" size={20} />
            Appeler le {contact.phone}
          </a>
        )}
      </div>
    </section>
  );
}
