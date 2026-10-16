"use client";

import { Menu } from "lucide-react";
import { useEffect, useRef, type JSX, type ReactNode } from "react";

export function MobileNavigation({ children }: { children: ReactNode }): JSX.Element {
  const details = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const close = () => {
      if (details.current) details.current.open = false;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && details.current?.open) {
        close();
        details.current.querySelector("summary")?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!details.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return (
    <details className="mobile-navigation" ref={details}>
      <summary aria-label="Menu">
        <Menu aria-hidden="true" size={24} strokeWidth={2} />
        <span>Menu</span>
      </summary>
      <nav
        aria-label="Navigation mobile"
        onClick={(event) => {
          // Client-side navigation keeps the header mounted, so close the menu explicitly.
          if ((event.target as HTMLElement).closest("a") && details.current) {
            details.current.open = false;
          }
        }}
      >
        {children}
      </nav>
    </details>
  );
}
