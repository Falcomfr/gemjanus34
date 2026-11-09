import { HeartHandshake } from "lucide-react";
import type { JSX } from "react";

export function MembershipLink({ href, className = "button button--primary" }: { href: string | null; className?: string }): JSX.Element | null {
  if (!href) return null;
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      <HeartHandshake aria-hidden="true" size={20} />
      Adhérer ou faire un don
      <span className="sr-only"> (nouvel onglet)</span>
    </a>
  );
}
