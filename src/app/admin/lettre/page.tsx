import { ExternalLink, Mail } from "lucide-react";
import { headers } from "next/headers";
import { LetterForm } from "@/components/admin/letter-form";
import { requireProfile } from "@/lib/auth/require-profile";
import { getLetterNote } from "@/lib/letter/letter-note";

export default async function AdminLetterPage() {
  await requireProfile();
  const [note, host] = await Promise.all([getLetterNote(), headers().then((list) => list.get("host"))]);
  const letterUrl = `https://${host ?? "gemjanus34.vercel.app"}/lettre`;
  const mailto = `mailto:?subject=${encodeURIComponent("Quoi de neuf au GEM cette semaine")}&body=${encodeURIComponent(
    `Bonjour,\n\nVoici la lettre de la semaine de Janus34 :\n${letterUrl}\n\nÀ bientôt au GEM !`,
  )}`;

  return (
    <div className="admin-dashboard">
      <header className="admin-page-header">
        <p className="eyebrow eyebrow--dark">Contenu</p>
        <h1>Lettre de la semaine</h1>
        <p>
          La lettre se compose toute seule à partir du planning (fermetures, annulations, séances en plus) et des
          actualités à venir. Ajoutez si vous le souhaitez un mot de l’équipe, puis imprimez-la ou envoyez-la.
        </p>
      </header>
      <p className="admin-form-actions">
        <a className="button button--dark" href="/lettre" target="_blank" rel="noopener noreferrer">
          <ExternalLink aria-hidden="true" size={18} />
          Voir et imprimer la lettre
        </a>
        <a className="button button--light admin-button--outlined" href={mailto}>
          <Mail aria-hidden="true" size={18} />
          Envoyer par e-mail
        </a>
      </p>
      <LetterForm note={note} />
    </div>
  );
}
