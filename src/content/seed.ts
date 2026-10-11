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
        body: "Un Groupe d'Entraide Mutuelle est un espace de lien social et d'entraide. Il ne remplace pas une structure de soins.",
      },
    ],
  },
  {
    slug: "mentions-legales",
    title: "Mentions légales",
    introduction: "Informations légales relatives au site public de l'association Janus34.",
    sections: [],
  },
  {
    slug: "confidentialite",
    title: "Confidentialité",
    introduction: "Informations relatives à la protection des données sur le site public de Janus34.",
    sections: [],
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
];
