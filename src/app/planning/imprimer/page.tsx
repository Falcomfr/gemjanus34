import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/planning/print-button";
import { WeekPlanning } from "@/components/planning/week-planning";
import { contact } from "@/content/contact";
import { getPublicContentRepository } from "@/lib/content/public-repository";
import { resolveWeek } from "@/lib/planning/week";

export const metadata: Metadata = {
  title: "Planning imprimable",
  description: "Le planning de la semaine de Janus34, à imprimer ou enregistrer en PDF.",
};

type PrintablePlanningPageProps = { searchParams?: Promise<{ semaine?: string | string[] }> };

export default async function PrintablePlanningPage({ searchParams }: PrintablePlanningPageProps = {}) {
  const planning = await getPublicContentRepository().getPlanning();
  if (!planning?.slots.length) notFound();
  const requested = (await searchParams)?.semaine;
  const { monday } = resolveWeek(typeof requested === "string" ? requested : undefined, new Date().toISOString());

  return (
    <div className="printable-planning">
      <div className="content-container printable-planning__actions">
        <Link className="text-link" href={`/actualites?semaine=${monday}#planning`}>
          <ArrowLeft aria-hidden="true" size={20} />
          Retour au planning
        </Link>
        <PrintButton />
        <p>Dans la fenêtre d’impression, choisissez « Enregistrer en PDF » et l’orientation paysage.</p>
      </div>
      <div className="printable-planning__sheet">
        <header className="printable-planning__brand">
          <Image src="/images/janus34-logo.png" alt="" width={64} height={64} />
          <p>
            <strong>Janus34</strong> · Groupe d’Entraide Mutuelle · {contact.street}, {contact.city} ·{" "}
            {contact.phone}
          </p>
        </header>
        <WeekPlanning planning={planning} monday={monday} printable />
      </div>
    </div>
  );
}
