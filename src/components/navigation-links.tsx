"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { JSX } from "react";
import { publicNavigation, type NavigationItem } from "@/content/navigation";
import type { ExtraPage } from "@/lib/content/extra-pages";

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
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
