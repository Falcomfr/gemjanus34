"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { JSX, ReactNode } from "react";
import { publicNavigation, type NavigationItem } from "@/content/navigation";
import type { ExtraPage } from "@/lib/content/extra-pages";

// A label past 16 characters goes on two lines cut at its most balanced space:
// a box whose text wraps by itself keeps its full width and leaves a gap beside it.
function menuLabel(label: string): ReactNode {
  if (label.length <= 16) return label;
  let cut = -1;
  for (let space = label.indexOf(" "); space !== -1; space = label.indexOf(" ", space + 1)) {
    const longest = (at: number) => Math.max(at, label.length - at - 1);
    if (cut === -1 || longest(space) < longest(cut)) cut = space;
  }
  if (cut === -1) return label;
  return <>{label.slice(0, cut)} <br />{label.slice(cut + 1)}</>;
}

export function NavigationLinks({ extraPages = [], galleryEnabled = false }: { extraPages?: ExtraPage[]; galleryEnabled?: boolean }): JSX.Element {
  const pathname = usePathname();
  // Pages added in the admin go just before Ressources and Contact, which stay last;
  // the switched-on gallery follows the first of them (the outings page).
  const added: NavigationItem[] = extraPages.map((page) => ({ href: `/${page.slug}`, label: page.title }));
  if (galleryEnabled) added.splice(Math.min(1, added.length), 0, { href: "/galerie", label: "Galerie" });
  const items: NavigationItem[] = [...publicNavigation.slice(0, -2), ...added, ...publicNavigation.slice(-2)];

  return (
    <ul className="navigation-list">
      {items.map((item) => {
        const current = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link
              className={item.prominent ? "navigation-link navigation-link--prominent" : "navigation-link"}
              href={item.href}
              aria-current={current ? "page" : undefined}
            >
              {menuLabel(item.label)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
