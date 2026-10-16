"use client";

import { useEffect, useState, type JSX, type ReactNode } from "react";

/** The site header, made compact once the page has scrolled. */
export function StickyHeader({ children }: { children: ReactNode }): JSX.Element {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const update = () => setCompact(window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return <header className={`site-header${compact ? " site-header--compact" : ""}`}>{children}</header>;
}
