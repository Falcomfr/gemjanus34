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
      "Pour découvrir Janus34, contactez l'association par téléphone ou rendez-vous au 405 rue des Grèzes à Montpellier.",
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
        body: "Janus34 se trouve au 405 rue des Grèzes à Montpellier. Pour préparer votre trajet en transports en commun, demandez à l'équipe les indications adaptées au moment de votre appel.",
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
    id: "planning-2026-06-19",
    title: "Planning 19 06 2026",
    excerpt: "Le PDF intitulé « Planning 19 06 2026 » est daté du 19 juin 2026.",
    startsAt: "2026-06-19",
    endsAt: null,
    featured: false,
    status: "published",
  },
  {
    id: "compte-rendu-ag-2025",
    title: "Compte rendu AG 2025",
    excerpt: "L'assemblée générale s'est tenue le 10 mai 2025.",
    startsAt: "2025-05-10",
    endsAt: null,
    featured: false,
    status: "published",
  },
];

export const publicDocuments: ReadonlyArray<PublicDocument> = [
  {
    id: "current-planning",
    title: "Planning des activités",
    slug: "planning-des-activites",
    description: "Le planning public des activités proposé par Janus34.",
    category: "planning",
    mimeType: "application/pdf",
    updatedAt: "2026-10-11",
    downloadUrl: "/documents/planning-des-activites",
  },
  {
    id: "association-statutes",
    title: "Statuts de l'association",
    slug: "statuts-association",
    description: "Les statuts de l'association Janus34.",
    category: "institutional",
    mimeType: "application/pdf",
    updatedAt: "2026-10-11",
    downloadUrl: "/documents/statuts-association",
  },
  {
    id: "internal-rules",
    title: "Règlement intérieur",
    slug: "reglement-interieur",
    description: "Le règlement intérieur de l'association Janus34.",
    category: "institutional",
    mimeType: "application/pdf",
    updatedAt: "2026-10-11",
    downloadUrl: "/documents/reglement-interieur",
  },
  {
    id: "bipolar-disorder-guide",
    title: "Repères sur le trouble bipolaire",
    slug: "reperes-trouble-bipolaire",
    description: "Un document d'information générale sur le trouble bipolaire, sans conseil médical personnalisé.",
    category: "health",
    mimeType: "application/pdf",
    updatedAt: "2026-10-11",
    downloadUrl: "/documents/reperes-trouble-bipolaire",
  },
  {
    id: "professional-support-guide",
    title: "S'orienter vers un professionnel de santé",
    slug: "orientation-professionnel-sante",
    description: "Des repères généraux pour identifier les interlocuteurs du soin, distincts des activités de Janus34.",
    category: "health",
    mimeType: "application/pdf",
    updatedAt: "2026-10-11",
    downloadUrl: "/documents/orientation-professionnel-sante",
  },
];
