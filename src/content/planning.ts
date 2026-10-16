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
    { id: "lundi-expression", day: 1, startsAt: "14:00", endsAt: "16:00", title: "Expression créatrice", leader: "Sarah", note: "", family: "creer" },
    { id: "mardi-qi-gong", day: 2, startsAt: "14:30", endsAt: "15:30", title: "Qi Gong", leader: "Adrien", note: "", family: "bouger" },
    { id: "mardi-echange", day: 2, startsAt: "16:00", endsAt: "17:30", title: "Groupe d'échange libre / groupe de parole à thème", leader: "Mona et Elif", note: "En alternance", family: "echanger" },
    { id: "mercredi-mots", day: 3, startsAt: "15:00", endsAt: "16:00", title: "Les mots qui volent", leader: "Elif", note: "", family: "creer" },
    { id: "jeudi-hors-les-murs", day: 4, startsAt: "10:00", endsAt: "13:00", title: "GEM « Hors les murs »", leader: "Elif", note: "Accueil au café Little Italy Shop de 10 h à 10 h 45, puis visite d'exposition, balade, pique-nique…", family: "bouger" },
    { id: "jeudi-soupe", day: 4, startsAt: "10:00", endsAt: "13:00", title: "Soupe au caillou", leader: "Elif", note: "Chaque dernier jeudi du mois, à la place du GEM « Hors les murs ». Sur inscription.", family: "echanger" },
    { id: "jeudi-yoga", day: 4, startsAt: "15:00", endsAt: "16:30", title: "Yoga en douceur", leader: "Sévérine", note: "", family: "bouger" },
    { id: "jeudi-ecriture", day: 4, startsAt: "16:45", endsAt: "17:45", title: "Écriture poétique", leader: "Mona", note: "", family: "creer" },
    { id: "vendredi-linogravure", day: 5, startsAt: "14:00", endsAt: "16:00", title: "Linogravure", leader: "Elif", note: "", family: "creer" },
    { id: "samedi-collectif", day: 6, startsAt: "13:00", endsAt: "18:00", title: "Événements collectifs", leader: "", note: "Goûters, projection de film, repas, pétanque, sortie…", family: "echanger" },
    { id: "samedi-collage", day: 6, startsAt: "14:00", endsAt: "15:00", title: "Collage", leader: "Mona", note: "Une fois par mois", family: "creer" },
  ],
};
