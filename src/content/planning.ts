import type { Planning } from "@/content/types";

// Same content as Planning-19-06-2026.pdf (in force from 22/06/2026) and migration 20261016190000.
export const bundledPlanning: Planning = {
  effectiveFrom: "2026-06-22",
  note: "Ouverture du GEM à 13 h et accueil du public.",
  days: [
    { day: 1, opensAt: "13:00", closesAt: "18:00", team: "Mona" },
    { day: 2, opensAt: "13:00", closesAt: "18:00", team: "Mona et Elif" },
    { day: 3, opensAt: "13:00", closesAt: "18:00", team: "Elif et Mona" },
    { day: 4, opensAt: "13:00", closesAt: "18:00", team: "Mona et Elif" },
    { day: 5, opensAt: "13:00", closesAt: "18:00", team: "Elif et Mona" },
    { day: 6, opensAt: "13:00", closesAt: "18:00", team: "Adhérent ou animatrice" },
  ],
  slots: [
    { id: "lundi-expression", day: 1, startsAt: "14:00", endsAt: "16:00", title: "Expression créatrice", description: "Un temps pour s'exprimer librement par les arts plastiques : dessin, peinture, couleurs. Aucun niveau n'est demandé.", leader: "Sarah", note: "", family: "creer" },
    { id: "mardi-qi-gong", day: 2, startsAt: "14:30", endsAt: "15:30", title: "Qi Gong", description: "Une gymnastique douce d'origine chinoise : des mouvements lents, accordés à la respiration, pour se détendre et se recentrer.", leader: "Adrien", note: "", family: "bouger" },
    { id: "mardi-echange", day: 2, startsAt: "16:00", endsAt: "17:30", title: "Groupe d'échange libre / groupe de parole à thème", description: "En alternance, un temps d'échange libre entre adhérents ou un groupe de parole autour d'un thème. Chacun parle s'il le souhaite.", leader: "Mona et Elif", note: "En alternance", family: "echanger" },
    { id: "mercredi-mots", day: 3, startsAt: "15:00", endsAt: "16:00", title: "Les mots qui volent", description: "Un atelier autour des mots et de l'écriture.", leader: "Elif", note: "", family: "creer" },
    { id: "jeudi-hors-les-murs", day: 4, startsAt: "10:00", endsAt: "13:00", title: "GEM « Hors les murs »", description: "Le jeudi matin, rendez-vous de 10 h à 10 h 45 au café Little Italy Shop, 4 bis cours Gambetta (près de l'arrêt Saint-Denis du tram 3), puis sortie : visite d'exposition, balade, pique-nique…", leader: "Elif", note: "Accueil au café Little Italy Shop de 10 h à 10 h 45, puis visite d'exposition, balade, pique-nique…", family: "bouger" },
    { id: "jeudi-soupe", day: 4, startsAt: "10:00", endsAt: "13:00", title: "Soupe au caillou", description: "Un temps convivial le dernier jeudi du mois, à la place du GEM « Hors les murs ». Inscription auprès de l'équipe.", leader: "Elif", note: "Chaque dernier jeudi du mois, à la place du GEM « Hors les murs ». Sur inscription.", family: "echanger" },
    { id: "jeudi-yoga", day: 4, startsAt: "15:00", endsAt: "16:30", title: "Yoga en douceur", description: "Des postures simples et des exercices de respiration, adaptés à chacun, pour assouplir le corps et se détendre.", leader: "Sévérine", note: "", family: "bouger" },
    { id: "jeudi-ecriture", day: 4, startsAt: "16:45", endsAt: "17:45", title: "Écriture poétique", description: "Un atelier d'écriture pour composer et partager des textes poétiques.", leader: "Mona", note: "", family: "creer" },
    { id: "vendredi-linogravure", day: 5, startsAt: "14:00", endsAt: "16:00", title: "Linogravure", description: "Une technique de gravure : on creuse un motif dans une plaque de linoléum, puis on l'imprime sur papier.", leader: "Elif", note: "", family: "creer" },
    { id: "samedi-collectif", day: 6, startsAt: "13:00", endsAt: "18:00", title: "Événements collectifs", description: "Le samedi, le GEM est ouvert par un adhérent porteur de clés ou par une animatrice, pour des temps collectifs : goûters, projections de film, repas, pétanque, sorties…", leader: "", note: "Goûters, projection de film, repas, pétanque, sortie…", family: "echanger" },
    { id: "samedi-collage", day: 6, startsAt: "14:00", endsAt: "15:00", title: "Collage", description: "Une fois par mois, un atelier de collage pour composer des images à partir de papiers, de magazines et de couleurs.", leader: "Mona", note: "Une fois par mois", family: "creer" },
  ],
};
