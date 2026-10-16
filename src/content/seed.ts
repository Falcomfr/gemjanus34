import type { NewsItem, PublicDocument, PublicPage } from "@/content/types";

export const publicPages: ReadonlyArray<PublicPage> = [
  {
    slug: "qui-sommes-nous",
    title: "Qui sommes-nous ?",
    eyebrow: "L'association",
    introduction:
      "Janus34 est une association loi 1901 et un Groupe d'Entraide Mutuelle fondé en 2006 à Montpellier.",
    sections: [
      {
        id: "gem",
        title: "Un Groupe d'Entraide Mutuelle",
        body: "Janus34 propose un lieu d'accueil, de partage et d'activités qui favorise le lien social, l'entraide et l'autonomie.",
      },
      {
        id: "association",
        title: "Une association",
        body: "La vie de l'association repose sur la participation de ses adhérents et sur des temps collectifs.",
      },
      {
        id: "objectifs",
        title: "Nos objectifs",
        body: "Janus34 agit pour rompre l'isolement, encourager l'entraide et soutenir l'autonomie et la participation sociale de ses adhérents.",
      },
    ],
  },
  {
    slug: "activites",
    title: "Activités",
    introduction:
      "Les activités de Janus34 sont des occasions de se rencontrer, de créer, de s'exprimer et de participer à la vie collective.",
    sections: [
      {
        id: "participer",
        title: "Participer à son rythme",
        body: "Les propositions peuvent prendre la forme d'activités créatives, culturelles, sportives ou de temps d'échange.",
      },
      {
        id: "propositions",
        title: "Des propositions variées",
        body: "Le programme peut réunir expression et créativité, réflexion collective, mobilisation corporelle, sorties culturelles et activités sportives.",
      },
    ],
  },
  {
    slug: "nous-rejoindre",
    title: "Nous rejoindre",
    eyebrow: "Accueil",
    introduction:
      "Avant une première visite, contactez l'association par téléphone pour convenir d'un premier accueil.",
    sections: [
      {
        id: "contact",
        title: "Prendre contact",
        body: "L'équipe de Janus34 répond au 04 67 04 87 68 pour présenter l'association et les modalités d'accueil.",
      },
      {
        id: "premiere-visite",
        title: "Préparer une première visite",
        body: "Avant de venir pour la première fois, téléphonez à l'association. L'équipe pourra convenir avec vous d'un temps d'accueil et expliquer le fonctionnement du lieu, sans engagement d'adhésion.",
      },
      {
        id: "adresse-transports",
        title: "Adresse et transports en commun",
        body: "Janus34 se trouve au 405 rue des Grèzes à Montpellier. En transports en commun, prenez la ligne de bus 11 et descendez à l'arrêt « La Martelle ».",
      },
    ],
  },
  {
    slug: "ressources",
    title: "Ressources",
    introduction:
      "Cette page rassemble des documents publics de Janus34 et des informations sélectionnées par l'association.",
    sections: [
      {
        id: "role-du-gem",
        title: "Le rôle du GEM",
        body: "Un Groupe d'Entraide Mutuelle est un espace de lien social et d'entraide. Janus34 n'est ni un professionnel de santé ni un service de soins, et les informations proposées ici ne remplacent pas l'avis d'un professionnel de santé.",
      },
      {
        id: "informations-generales",
        title: "Des informations générales",
        body: "Les ressources présentées ont un rôle d'information générale. Elles ne permettent pas d'établir un diagnostic et ne constituent pas des conseils médicaux.",
      },
    ],
  },
  {
    slug: "mentions-legales",
    title: "Mentions légales",
    introduction: "Contenu provisoire en attente de validation par l'association avant la mise en production du site.",
    sections: [
      {
        id: "validation-requise",
        title: "Validation requise avant mise en production",
        body: "L'association doit compléter et valider les informations relatives à l'édition et à l'hébergement du site. Aucune identité de représentant légal ni donnée d'immatriculation non vérifiée n'est publiée ici.",
      },
    ],
  },
  {
    slug: "confidentialite",
    title: "Confidentialité",
    introduction: "Contenu provisoire en attente de validation par l'association avant la mise en production du site.",
    sections: [
      {
        id: "validation-requise",
        title: "Validation requise avant mise en production",
        body: "L'association doit définir et valider les informations relatives aux données traitées, à leur durée de conservation et aux modalités d'exercice des droits avant l'ouverture du site au public.",
      },
    ],
  },
];

export const newsItems: ReadonlyArray<NewsItem> = [
  {
    id: "compte-rendu-ag-2025",
    title: "Assemblée générale 2025",
    excerpt:
      "L'assemblée générale de Janus34 s'est tenue le 10 mai 2025. Son compte rendu est disponible dans la présentation du GEM.",
    startsAt: "2025-05-10",
    endsAt: null,
    featured: false,
    status: "published",
  },
];

function pdf(
  slug: string,
  title: string,
  description: string,
  category: PublicDocument["category"],
  updatedAt = "2026-10-16",
): PublicDocument {
  return {
    id: slug,
    title,
    slug,
    description,
    category,
    mimeType: "application/pdf",
    updatedAt,
    downloadUrl: `/documents/${slug}.pdf`,
  };
}

export const publicDocuments: ReadonlyArray<PublicDocument> = [
  pdf(
    "planning-des-activites",
    "Planning des activités",
    "Le planning hebdomadaire des ateliers et des temps collectifs, en vigueur à partir du 22 juin 2026.",
    "planning",
    "2026-06-22",
  ),
  pdf("statuts-association", "Statuts de l'association", "Les statuts de Janus34, version d'avril 2009.", "institutional"),
  pdf("reglement-interieur", "Règlement intérieur", "Le règlement intérieur de l'association, version de mai 2021.", "institutional"),
  pdf("regles-de-vie", "Règles de vie", "Les rappels pour faciliter le vivre ensemble au GEM.", "institutional"),
  pdf(
    "compte-rendu-ag-2025",
    "Compte rendu de l'assemblée générale 2025",
    "Le compte rendu de l'assemblée générale du 10 mai 2025.",
    "institutional",
  ),
  pdf(
    "questions-reponses-troubles-bipolaires",
    "Questions et réponses sur les troubles bipolaires",
    "Un document d'information générale pour mieux comprendre les troubles bipolaires.",
    "health",
  ),
  pdf(
    "connaitre-trouble-bipolaire",
    "Le trouble bipolaire : le connaître pour mieux le reconnaître",
    "Un document de sensibilisation sur les signes du trouble bipolaire.",
    "health",
  ),
  pdf(
    "vivre-avec-troubles-bipolaires",
    "Apprendre à vivre avec des troubles bipolaires",
    "Un guide à l'usage des personnes concernées et de leurs proches.",
    "health",
  ),
  pdf("conseils-entourage", "Conseils à l'entourage", "Des repères pour les proches d'une personne concernée.", "health"),
  pdf(
    "diagramme-humeur",
    "Diagramme de l'humeur",
    "Un outil, avec ses instructions, pour suivre l'évolution de l'humeur.",
    "health",
  ),
];
