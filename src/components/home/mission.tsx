import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { JSX } from "react";

const families = [
  {
    title: "Créer et s'exprimer",
    examples: "Expression créatrice, écriture poétique, « Les mots qui volent », linogravure, collage.",
  },
  {
    title: "Bouger et prendre l'air",
    examples: "Qi Gong, yoga en douceur, et le GEM « Hors les murs » : expositions, balades, pique-niques.",
  },
  {
    title: "Échanger et agir ensemble",
    examples: "Groupes d'échange et de parole, goûters, repas, projections et la vie de l'association.",
  },
] as const;

export function Mission(): JSX.Element {
  return (
    <section className="mission" aria-labelledby="mission-title">
      <div className="content-container mission__inner">
        <div className="mission__heading">
          <p className="eyebrow eyebrow--dark">Un projet collectif</p>
          <h2 id="mission-title">Un espace d&apos;entraide, pas un lieu de soins</h2>
        </div>
        <div className="mission__copy">
          <p>
            Un Groupe d&apos;Entraide Mutuelle est un lieu de lien social. À Janus34, chacun vient à
            son rythme, participe aux activités qui lui plaisent et prend part, s&apos;il le
            souhaite, à la vie de l&apos;association. Le Conseil d&apos;Administration est composé
            d&apos;adhérents.
          </p>
          <p>
            Le GEM ne remplace pas un suivi médical : il offre un cadre accueillant pour se
            rencontrer, reprendre confiance et rompre l&apos;isolement.
          </p>
          <ul className="activity-families">
            {families.map((family) => (
              <li key={family.title}>
                <h3>{family.title}</h3>
                <p>{family.examples}</p>
              </li>
            ))}
          </ul>
          <Link className="text-link" href="/activites">
            Découvrir toutes les activités
            <ArrowRight aria-hidden="true" size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
}
