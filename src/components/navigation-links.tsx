"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { JSX } from "react";
import { publicNavigation } from "@/content/navigation";

export function NavigationLinks(): JSX.Element {
  const pathname = usePathname();

  return (
    <ul className="navigation-list">
      {publicNavigation.map((item) => {
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
