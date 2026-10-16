import type { NewsItem, PublicDocument, PublicPage } from "@/content/types";

export const publicPages: ReadonlyArray<PublicPage> = [
  {
    slug: "qui-sommes-nous",
    title: "Le GEM Janus34",
    eyebrow: "L'association",
    introduction:
      "Janus34 est un Groupe d'Entraide Mutuelle et une association loi 1901 fondée en 2006 à Montpellier. Ses adhérents, tous concernés par des troubles psychiques, en font un lieu de rencontre, d'entraide et de partage.",
    sections: [
      {
        id: "gem",
        title: "Qu'est-ce qu'un Groupe d'Entraide Mutuelle ?",
        body: "Un Groupe d'Entraide Mutuelle, ou GEM, est une association de personnes qui vivent des difficultés psychiques et se retrouvent pour s'entraider, partager des activités et rompre l'isolement. On y vient librement, à son rythme.\n\nLes GEM fonctionnent selon un cahier des charges national publié au Journal officiel.",
        links: [
          {
            label: "Cahier des charges des GEM (Légifrance)",
            href: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000038792936",
          },
        ],
      },
      {
        id: "histoire",
        title: "Janus34 depuis 2006",
        body: "Janus34 a été fondée en 2006 par des personnes et des proches concernés par des troubles bipolaires. L'association s'est donné pour objectif de rompre les solitudes et de favoriser l'entraide, la solidarité et le partage entre ses membres.\n\nElle informe et soutient aussi les personnes qui présentent des troubles de l'humeur et d'autres difficultés psychiques. Dans la mythologie romaine, Janus est le dieu des commencements, des passages et des portes.",
      },
      {
        id: "valeurs",
        title: "Ce que nous partageons",
        body: "La vie du GEM repose sur quelques principes simples.",
        items: [
          "L'entraide : chacun apporte son expérience et peut s'appuyer sur celle des autres.",
          "Le lien social : se retrouver, discuter, sortir ensemble.",
          "L'autonomie : la participation aux activités n'est jamais obligatoire.",
          "La participation : chacun peut prendre part à la vie de l'association.",
        ],
      },
      {
        id: "association",
        title: "Une association gérée par ses adhérents",
        body: "Les adhérents de Janus34 sont tous des personnes concernées par des troubles psychiques. Le Conseil d'Administration est uniquement composé d'adhérents : ce sont donc des adhérents qui prennent les décisions de l'association.\n\nAprès un entretien d'accueil, une personne qui découvre le GEM vient d'abord comme visiteur, pendant une dizaine de venues. Son adhésion est ensuite validée par le Conseil d'Administration.",
      },
      {
        id: "equipe",
        title: "L'équipe d'animation et les intervenants",
        body: "Une équipe d'animatrices salariées accueille les adhérents et anime une partie des activités. D'autres ateliers sont animés par des intervenants extérieurs professionnels, par des stagiaires ou par des adhérents.\n\nLe samedi, le GEM est ouvert par un adhérent ou par une animatrice, pour des temps collectifs.",
      },
      {
        id: "soins",
        title: "Un lieu d'entraide, distinct du soin",
        body: "Janus34 n'est pas une structure de soins et ne remplace pas un suivi médical ou psychologique. L'association n'établit pas de diagnostic et ne délivre pas de traitement.\n\nLe GEM peut en revanche compléter un parcours de soins en offrant un lieu de rencontre, d'activités et de soutien entre pairs. Des professionnels du CHU de Montpellier sont déjà intervenus au GEM lors de conférences d'information.",
      },
    ],
  },
  {
    slug: "activites",
    title: "Activités",
    eyebrow: "La vie au GEM",
    introduction:
      "Ateliers créatifs, activités corporelles douces, groupes d'échange et sorties rythment la semaine à Janus34. Chacun y participe librement, selon ses envies.",
    sections: [
      {
        id: "creer",
        title: "Créer et s'exprimer",
        body: "Les ateliers d'expression stimulent l'imagination et la concentration. Ils permettent de se décentrer des difficultés et de s'ouvrir à de nouveaux centres d'intérêt.",
        items: ["Expression créatrice", "« Les mots qui volent »", "Écriture poétique", "Linogravure", "Collage"],
      },
      {
        id: "bouger",
        title: "Bouger et prendre l'air",
        body: "Remettre le corps en mouvement aide à retrouver le plaisir de bouger, à reprendre confiance en soi et à relâcher les tensions.",
        items: [
          "Qi Gong",
          "Yoga en douceur",
          "GEM « Hors les murs » : un temps d'accueil dans un café du centre-ville, puis une visite d'exposition, une balade ou un pique-nique",
        ],
      },
      {
        id: "echanger",
        title: "Échanger et agir ensemble",
        body: "Les temps d'échange permettent de mieux se connaître, de partager son expérience et d'être soutenu face à la maladie.",
        items: [
          "Groupe d'échange libre et groupe de parole à thème, en alternance",
          "Temps collectifs du samedi : goûters, projections de film, repas, pétanque, sorties",
          "« Soupe au caillou », chaque dernier jeudi du mois, sur inscription",
          "Assemblée générale et vie de l'association",
        ],
      },
      {
        id: "comprendre",
        title: "Mieux comprendre la maladie",
        body: "Janus34 organise des conférences d'information sur le trouble bipolaire avec des professionnels de santé, sur inscription. Le programme du prochain cycle sera annoncé dans les actualités.\n\nCes temps d'information ne remplacent pas un suivi personnel par un professionnel de santé.",
      },
      {
        id: "programme",
        title: "Un programme qui évolue",
        body: "Le planning évolue au fil du temps. Certaines activités demandent une inscription, comme la « Soupe au caillou » ou les conférences.\n\nLe planning en vigueur reste la référence pour connaître les jours et les horaires. En cas de doute, appelez l'équipe au 04 67 04 87 68.",
        links: [{ label: "Voir le planning de la semaine", href: "/actualites#planning" }],
      },
    ],
  },
  {
    slug: "nous-rejoindre",
    title: "Préparer une première visite",
    eyebrow: "Première visite",
    introduction:
      "Avant une première visite, contactez l'association par téléphone pour convenir d'un premier accueil. Une animatrice vous présentera le GEM et son fonctionnement.",
    sections: [
      {
        id: "etapes",
        title: "Comment se passe une première visite ?",
        body: "",
        ordered: true,
        items: [
          "Appelez le 04 67 04 87 68 l'après-midi, du lundi au vendredi. Si personne ne répond, laissez un message avec vos coordonnées : l'équipe vous rappellera.",
          "Convenez d'un rendez-vous pour un entretien d'accueil avec une animatrice.",
          "Pendant cet entretien, découvrez le lieu, les activités et les règles de vie du GEM, et posez toutes vos questions.",
          "Revenez si vous le souhaitez : pendant une dizaine de venues, vous êtes « visiteur » et découvrez l'association à votre rythme.",
          "Décidez librement d'adhérer. L'adhésion est ensuite validée par le Conseil d'Administration.",
        ],
      },
      {
        id: "public",
        title: "À qui s'adresse Janus34 ?",
        body: "Janus34 accueille des personnes concernées par des troubles psychiques qui souhaitent rompre l'isolement, rencontrer d'autres personnes et partager des activités.",
      },
      {
        id: "adresse-transports",
        title: "Adresse et transports en commun",
        body: "Janus34 se trouve au 405 rue des Grèzes à Montpellier (34070).\n\nEn transports en commun, prenez la ligne de bus 11 et descendez à l'arrêt « La Martelle ».",
      },
      {
        id: "horaires",
        title: "Horaires",
        body: "Le GEM ouvre ses portes à 13 h, du lundi au samedi. Le jeudi matin, le GEM « Hors les murs » donne rendez-vous en ville. Le planning des activités précise le programme de chaque jour.",
        links: [{ label: "Voir le planning de la semaine", href: "/actualites#planning" }],
      },
      {
        id: "sans-engagement",
        title: "Sans engagement",
        body: "La première visite n'engage à rien. Vous pouvez découvrir les activités, poser vos questions et prendre le temps de décider. Les règles de vie du GEM, que l'équipe vous présentera, facilitent le vivre ensemble.",
        links: [{ label: "Lire les règles de vie (PDF)", href: "/documents/regles-de-vie.pdf" }],
      },
    ],
  },
  {
    slug: "ressources",
    title: "Ressources",
    eyebrow: "S'informer",
    introduction:
      "Des documents et des sites sélectionnés par Janus34 pour mieux comprendre les troubles bipolaires, soutenir un proche et trouver des idées de sorties à Montpellier.",
    sections: [
      {
        id: "role-du-gem",
        title: "Le rôle de ces ressources",
        body: "Janus34 n'est ni un professionnel de santé ni un service de soins. Les ressources présentées ici ont un rôle d'information générale : elles ne permettent pas d'établir un diagnostic et ne constituent pas des conseils médicaux.\n\nElles peuvent aider à mettre des mots sur une expérience, à préparer un échange avec un médecin ou à mieux soutenir un proche.",
      },
      {
        id: "troubles-bipolaires",
        title: "Repères sur les troubles bipolaires",
        body: "Le trouble bipolaire se manifeste par l'alternance d'épisodes dépressifs et d'épisodes d'excitation de l'humeur, dits hypomaniaques ou maniaques, séparés ou non par des périodes d'humeur stable.\n\nLes documents à télécharger en bas de page permettent d'approfondir : questions et réponses, guide pour les personnes concernées et leurs proches, conseils à l'entourage et diagramme de l'humeur.",
        links: [
          {
            label: "Documentation de l'Association Bipolaire Provence",
            href: "http://assobipolaireprovence.unblog.fr/",
          },
        ],
      },
      {
        id: "videos",
        title: "Conférences en vidéo",
        body: "Deux vidéos retenues par l'association pour approfondir le sujet. Les conférences organisées au GEM sont annoncées dans les actualités.",
        links: [
          {
            label: "La schizophrénie et les troubles bipolaires, cours de Santé Québec (YouTube)",
            href: "https://www.youtube.com/watch?v=DpGc_XzHXw4",
          },
          {
            label: "TCC et troubles bipolaires (YouTube)",
            href: "https://www.youtube.com/watch?v=5PN11L4wXKA",
          },
        ],
      },
      {
        id: "sites",
        title: "Sites d'information",
        body: "Des sites reconnus pour s'informer sur la santé mentale, les troubles psychiques et les droits des personnes.",
        links: [
          { label: "Psycom, information sur la santé mentale", href: "https://www.psycom.org/" },
          { label: "Relief (anciennement Revivre), anxiété, dépression et bipolarité", href: "https://relief.ca/" },
          { label: "PsychoMédia, actualités en psychologie et santé", href: "https://www.psychomedia.qc.ca/" },
        ],
      },
      {
        id: "sorties",
        title: "Sorties culturelles et sportives",
        body: "Pour trouver des idées de sorties et d'activités à Montpellier, l'association recommande notamment ces partenaires.",
        links: [
          { label: "Culture et Sport Solidaires 34", href: "https://www.cultureetsportsolidaires34.fr/" },
          { label: "Montpellier Culture Sport Adapté (MCSA34)", href: "https://www.mcsa34.com/" },
          { label: "Agenda de l'office de tourisme de Montpellier", href: "https://www.montpellier-tourisme.fr/" },
        ],
      },
    ],
  },
  {
    slug: "mentions-legales",
    title: "Mentions légales",
    introduction: "Les informations sur l'éditeur et l'hébergeur du site de Janus34.",
    sections: [
      {
        id: "editeur",
        title: "Éditeur du site",
        body: "Ce site est édité par l'association Janus34.",
        items: [
          "Association Janus34, Groupe d'Entraide Mutuelle, association loi 1901",
          "Adresse : 405 rue des Grèzes, 34070 Montpellier",
          "Téléphone : 04 67 04 87 68",
        ],
      },
      {
        id: "publication",
        title: "Responsable de la publication",
        body: "La responsabilité de la publication est assurée par la présidence de l'association Janus34.",
      },
      {
        id: "hebergement",
        title: "Hébergement",
        body: "Le site est hébergé par :",
        items: ["Vercel Inc.", "440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis"],
        links: [{ label: "vercel.com", href: "https://vercel.com/" }],
      },
      {
        id: "propriete",
        title: "Propriété intellectuelle",
        body: "Les textes, le logo et les documents de l'association publiés sur ce site appartiennent à Janus34. Les documents d'information de tiers restent la propriété de leurs auteurs. Toute reproduction sans autorisation est interdite, sauf usage personnel et non commercial.",
      },
      {
        id: "responsabilite",
        title: "Limites de responsabilité",
        body: "Les informations de ce site sont fournies à titre indicatif. Janus34 s'efforce de les tenir à jour mais ne peut garantir leur exactitude ni leur pertinence. Les informations sur les troubles bipolaires ne remplacent pas l'avis d'un professionnel de santé.\n\nLes liens vers d'autres sites sont proposés pour information. Janus34 n'est pas responsable de leur contenu.",
      },
      {
        id: "droit",
        title: "Droit applicable",
        body: "Ce site est soumis au droit français. En cas de litige n'ayant pu faire l'objet d'un accord amiable, les tribunaux français sont seuls compétents.",
      },
    ],
  },
  {
    slug: "confidentialite",
    title: "Confidentialité",
    introduction:
      "Comment Janus34 traite les données personnelles sur ce site, conformément au Règlement général sur la protection des données (RGPD).",
    sections: [
      {
        id: "formulaire",
        title: "Formulaire de contact",
        body: "Le formulaire de contact n'est pas encore ouvert : aucune information saisie dans ses champs n'est envoyée ni enregistrée. Pour joindre l'équipe, utilisez le téléphone ou le courrier.\n\nLorsque l'envoi sera activé, cette page précisera les données transmises (nom, adresse e-mail, objet et message), leur usage, qui sera limité à la réponse à votre demande, et leur durée de conservation.",
      },
      {
        id: "navigation",
        title: "Navigation sur le site",
        body: "Le site ne dépose aucun cookie publicitaire ni de mesure d'audience. Comme pour tout site web, l'hébergeur Vercel enregistre des journaux techniques (adresse IP, page demandée, date et heure) nécessaires à la sécurité et au bon fonctionnement du service.",
      },
      {
        id: "administration",
        title: "Espace d'administration",
        body: "L'espace d'administration, réservé à l'équipe de Janus34, utilise des cookies techniques de connexion. Les comptes de l'équipe et les contenus publiés sont hébergés par le service Supabase.",
      },
      {
        id: "droits",
        title: "Vos droits",
        body: "Vous disposez d'un droit d'accès, de rectification, d'effacement et d'opposition sur les données qui vous concernent. Pour les exercer, contactez Janus34 par téléphone au 04 67 04 87 68 ou par courrier au 405 rue des Grèzes, 34070 Montpellier.\n\nSi vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL.",
        links: [{ label: "Adresser une plainte à la CNIL", href: "https://www.cnil.fr/fr/plaintes" }],
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
