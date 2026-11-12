"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { JSX } from "react";
import { publicNavigation, type NavigationItem } from "@/content/navigation";
import type { ExtraPage } from "@/lib/content/extra-pages";

export function NavigationLinks({ extraPages = [] }: { extraPages?: ExtraPage[] }): JSX.Element {
  const pathname = usePathname();
  // Pages added in the admin go just before Contact, which stays last.
  const items: NavigationItem[] = [
    ...publicNavigation.slice(0, -1),
    ...extraPages.map((page) => ({ href: `/${page.slug}`, label: page.title })),
    ...publicNavigation.slice(-1),
  ];

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
