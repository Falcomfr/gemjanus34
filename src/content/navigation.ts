export type NavigationItem = {
  href: string;
  label: string;
  prominent?: boolean;
};

export const publicNavigation: ReadonlyArray<NavigationItem> = [
  { href: "/qui-sommes-nous", label: "Le GEM" },
  { href: "/activites", label: "Activités" },
  { href: "/actualites", label: "Planning et actualités" },
  { href: "/nous-rejoindre", label: "Première visite", prominent: true },
  { href: "/ressources", label: "Ressources" },
  { href: "/contact", label: "Contact" },
];
