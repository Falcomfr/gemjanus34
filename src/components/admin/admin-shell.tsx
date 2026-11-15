import {
  CalendarDays,
  ChartColumn,
  ExternalLink,
  FileText,
  FolderOpen,
  Images,
  LayoutDashboard,
  LogOut,
  Mail,
  Mic,
  Newspaper,
  ScrollText,
  Settings,
  UserRound,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/app/admin/connexion/actions";
import type { Profile } from "@/lib/auth/require-profile";
import { roleLabels } from "@/lib/auth/roles";

const navigation = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/pages", label: "Pages", icon: FileText, pending: "pages" },
  { href: "/admin/actualites", label: "Actualités", icon: Newspaper, pending: "news" },
  { href: "/admin/planning", label: "Planning", icon: CalendarDays },
  { href: "/admin/lettre", label: "Lettre", icon: ScrollText },
  { href: "/admin/conferences", label: "Conférences", icon: Mic },
  { href: "/admin/documents", label: "Documents", icon: FolderOpen },
  { href: "/admin/galerie", label: "Galerie", icon: Images },
  { href: "/admin/messages", label: "Messages", icon: Mail, pending: "messages" },
  { href: "/admin/comptes", label: "Comptes", icon: Users, adminOnly: true },
  { href: "/admin/statistiques", label: "Statistiques", icon: ChartColumn, adminOnly: true },
  { href: "/admin/reglages", label: "Réglages", icon: Settings, adminOnly: true },
];

/** What waits in each section: unhandled messages, unpublished drafts. */
export type AdminPending = { messages?: number; pages?: number; news?: number };

const pendingLabels: Record<keyof AdminPending, (count: number) => string> = {
  messages: () => "à traiter",
  pages: (count) => (count === 1 ? "brouillon" : "brouillons"),
  news: (count) => (count === 1 ? "brouillon" : "brouillons"),
};

type AdminShellProps = {
  children: ReactNode;
  pathname: string;
  profile: Profile;
  pending?: AdminPending;
};

function isCurrentSection(pathname: string, href: string) {
  return href === "/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children, pathname, profile, pending = {} }: AdminShellProps) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-sidebar__brand" href="/admin">
          <Image className="admin-sidebar__logo" src="/images/janus34-visages.svg" alt="" width={40} height={40} unoptimized />
          <span>Administration</span>
        </Link>

        <nav aria-label="Navigation de l’administration">
          <ul className="admin-navigation">
            {navigation.filter((item) => !("adminOnly" in item) || profile.role === "admin").map((item) => {
              const { href, label, icon: Icon } = item;
              const key = "pending" in item ? (item.pending as keyof AdminPending) : undefined;
              const count = key ? (pending[key] ?? 0) : 0;
              const waiting = key && count > 0 ? `${count} ${pendingLabels[key](count)}` : null;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={isCurrentSection(pathname, href) ? "page" : undefined}
                    title={waiting ? `${label} : ${waiting}` : label}
                    aria-label={waiting ? `${label} ${waiting}` : undefined}
                  >
                    <Icon aria-hidden="true" size={20} />
                    <span>{label}</span>
                    {waiting ? (
                      <span className={`admin-navigation__badge${key === "messages" ? " admin-navigation__badge--urgent" : ""}`} aria-hidden="true">
                        {count}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <a className="admin-sidebar__site" href="/" target="_blank" rel="noopener noreferrer" title="Voir le site">
          <ExternalLink aria-hidden="true" size={20} />
          <span>Voir le site</span>
          <span className="sr-only"> (nouvel onglet)</span>
        </a>

        <div className="admin-sidebar__account">
          <Link className="admin-sidebar__me" href="/admin/mon-compte" title="Mon compte">
            <UserRound aria-hidden="true" size={20} />
            <span>
              <strong>{profile.displayName}</strong>
              <span>Mon compte · {roleLabels[profile.role]}</span>
            </span>
          </Link>
          <form action={logout}>
            <button type="submit">
              <LogOut aria-hidden="true" size={20} />
              <span>Déconnexion</span>
            </button>
          </form>
        </div>
      </aside>
      <div className="admin-main" id="admin-contenu">{children}</div>
    </div>
  );
}
