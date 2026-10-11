export type NavigationItem = {
  href: string;
  label: string;
  prominent?: boolean;
};

export const publicNavigation: ReadonlyArray<NavigationItem> = [
  { href: "/", label: "Accueil" },
  { href: "/qui-sommes-nous", label: "Qui sommes-nous ?" },
  { href: "/activites", label: "Activités" },
  { href: "/actualites", label: "Planning et actualités" },
  { href: "/nous-rejoindre", label: "Nous rejoindre", prominent: true },
  { href: "/ressources", label: "Ressources" },
  { href: "/contact", label: "Contact" },
];
