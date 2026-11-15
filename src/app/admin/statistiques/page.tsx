import Link from "next/link";
import type { ReactNode } from "react";
import { requireProfile } from "@/lib/auth/require-profile";
import { getCloudflareStats, type CloudflareResult } from "@/lib/stats/cloudflare";
import { siteEventLabels } from "@/lib/stats/site-events";
import {
  ACTIVITY_DAYS,
  conferenceFill,
  eventTotals,
  galleryBreakdown,
  lastMonths,
  messageStats,
  planningByMonth,
  staleContent,
  teamActivity,
} from "@/lib/stats/site-stats";
import { createServerClient } from "@/lib/supabase/server";

const monthLabel = (month: string) => new Date(`${month}-15T12:00:00Z`).toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
const dateLabel = (iso: string) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "Europe/Paris" }).format(new Date(iso));
const deviceLabels: Record<string, string> = { mobile: "Téléphone", desktop: "Ordinateur", tablet: "Tablette" };

function Section({ id, title, intro, children }: { id: string; title: string; intro?: string; children: ReactNode }) {
  return (
    <section className="admin-form-section stats-section" aria-labelledby={id}>
      <div className="admin-form-section__heading">
        <h2 id={id}>{title}</h2>
        {intro ? <p>{intro}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Tiles({ items }: { items: Array<{ label: string; value: string | number; note?: string }> }) {
  return (
    <dl className="stats-tiles">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>
            {item.value}
            {item.note ? <small>{item.note}</small> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Horizontal bars of one colour, each value written next to its bar. */
function BarList({ label, rows }: { label: string; rows: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  if (rows.length === 0) return <p className="admin-empty-state">Pas encore de données.</p>;
  return (
    <ul className="stats-bars" aria-label={label}>
      {rows.map((row) => (
        <li key={row.label}>
          <span className="stats-bars__label">{row.label}</span>
          <span className="stats-bars__track" aria-hidden="true">
            <span style={{ width: `${(row.value / max) * 100}%` }} />
          </span>
          <span className="stats-bars__value">{row.value}</span>
        </li>
      ))}
    </ul>
  );
}

function Table({ caption, head, rows }: { caption: string; head: string[]; rows: Array<{ key: string; cells: ReactNode[] }> }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table admin-table--compact">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {head.map((cell) => <th key={cell} scope="col">{cell}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              {row.cells.map((cell, index) => (index === 0 ? <th key={index} scope="row">{cell}</th> : <td key={index}>{cell}</td>))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Visits({ result }: { result: CloudflareResult }) {
  if (result.status === "missing_config") {
    return (
      <p className="admin-notice">
        Cloudflare n’est pas encore branché. Variables à poser dans Vercel : {result.missing.join(", ")}.
      </p>
    );
  }
  if (result.status === "error") return <p className="form-status form-status--error">Cloudflare n’a pas répondu : {result.message}</p>;

  const { data } = result;
  const max = Math.max(1, ...data.series.map((day) => day.visits));
  return (
    <>
      <Tiles
        items={[
          { label: `Visites sur ${data.periodDays} jours`, value: data.visits, note: "estimation de Cloudflare" },
          { label: "Pages vues", value: data.pageViews },
          { label: `Visites sur ${data.recentDays} jours`, value: data.recentVisits ?? "?", note: data.recentExact ? "chiffre exact" : "estimation" },
        ]}
      />
      <figure className="stats-columns">
        <figcaption>Visites par jour</figcaption>
        <ol aria-label="Visites par jour">
          {data.series.map((day) => (
            <li key={day.date} title={`${dateLabel(`${day.date}T12:00:00Z`)} : ${day.visits} visites`}>
              <span style={{ height: `${(day.visits / max) * 100}%` }} />
              <span className="sr-only">{`${dateLabel(`${day.date}T12:00:00Z`)} : ${day.visits} visites`}</span>
            </li>
          ))}
        </ol>
      </figure>
      <div className="stats-grid">
        <div>
          <h3>Pages les plus lues</h3>
          <BarList label="Pages les plus lues" rows={data.topPaths.map((row) => ({ label: row.label, value: row.visits }))} />
        </div>
        <div>
          <h3>D’où viennent les visiteurs</h3>
          <BarList label="Provenance des visites" rows={data.topReferers.map((row) => ({ label: row.label, value: row.visits }))} />
        </div>
        <div>
          <h3>Appareils</h3>
          <BarList label="Appareils" rows={data.topDevices.map((row) => ({ label: deviceLabels[row.label] ?? row.label, value: row.visits }))} />
        </div>
      </div>
    </>
  );
}

export default async function StatisticsPage() {
  const me = await requireProfile();
  if (me.role !== "admin") {
    return (
      <div className="admin-dashboard">
        <header className="admin-page-header">
          <h1>Statistiques</h1>
          <p>Les statistiques sont réservées aux administrateurs.</p>
        </header>
      </div>
    );
  }

  const now = new Date();
  const firstMonth = `${lastMonths(now)[0]}-01`;
  const supabase = await createServerClient();
  const [messages, events, conferences, seats, exceptions, pages, audit, profiles, gallery, visits] = await Promise.all([
    supabase.from("contact_messages").select("kind, created_at, handled_at"),
    supabase.from("site_events").select("day, event, count").gte("day", firstMonth),
    supabase.from("conferences").select("id, title, starts_at, capacity"),
    supabase.rpc("conference_seats_taken"),
    supabase.from("planning_exceptions").select("kind, date").gte("date", firstMonth),
    supabase.from("pages").select("title, slug, updated_at").eq("status", "published"),
    supabase.from("audit_log").select("actor_id, action, created_at").gte("created_at", new Date(now.getTime() - ACTIVITY_DAYS * 86_400_000).toISOString()),
    supabase.from("profiles").select("id, display_name"),
    supabase.from("gallery_items").select("kind, workshop"),
    getCloudflareStats(),
  ]);

  const inbox = messageStats(messages.data ?? [], now);
  const gestures = eventTotals(events.data ?? [], now);
  const fill = conferenceFill(conferences.data ?? [], seats.data ?? []);
  const planning = planningByMonth(exceptions.data ?? [], now);
  const content = staleContent(pages.data ?? [], now);
  const team = teamActivity(audit.data ?? [], new Map((profiles.data ?? []).map((profile) => [profile.id, profile.display_name])), now);
  const works = galleryBreakdown(gallery.data ?? []);

  return (
    <div className="admin-dashboard stats-page">
      <header className="admin-page-header">
        <p className="eyebrow eyebrow--dark">Site</p>
        <h1>Statistiques</h1>
        <p>Des totaux seulement : rien ne permet de savoir qui a visité ou cliqué.</p>
      </header>

      <Section id="stats-visits" title="Visites du site" intro="Mesurées par Cloudflare, sans cookie. Au-delà de 7 jours, Cloudflare donne une estimation.">
        <Visits result={visits} />
      </Section>

      <Section id="stats-gestures" title="Gestes des visiteurs" intro="Clics comptés jour par jour sur le site public. Un clic sur le numéro n’est pas forcément un appel abouti.">
        <Table
          caption="Gestes des visiteurs"
          head={["Geste", "30 derniers jours", "12 derniers mois"]}
          rows={gestures.map((row) => ({ key: row.event, cells: [siteEventLabels[row.event], row.last30, row.last365] }))}
        />
      </Section>

      <Section id="stats-messages" title="Messages">
        <Tiles
          items={[
            { label: "En attente", value: `${inbox.pending} à traiter` },
            { label: "Délai moyen de traitement", value: inbox.averageHours === null ? "?" : inbox.averageHours < 48 ? `${inbox.averageHours} h` : `${Math.round(inbox.averageHours / 24)} jours` },
          ]}
        />
        <Table
          caption="Messages reçus par mois"
          head={["Mois", "Messages écrits", "Demandes de rappel"]}
          rows={inbox.byMonth.map((row) => ({ key: row.month, cells: [monthLabel(row.month), row.messages, row.callbacks] }))}
        />
      </Section>

      <Section id="stats-conferences" title="Conférences">
        {fill.length === 0 ? (
          <p className="admin-empty-state">Aucune conférence enregistrée.</p>
        ) : (
          <Table
            caption="Remplissage des conférences"
            head={["Conférence", "Date", "Places prises", "Remplissage"]}
            rows={fill.map((row) => ({ key: `${row.title}-${row.startsAt}`, cells: [row.title, dateLabel(row.startsAt), `${row.taken} / ${row.capacity ?? "sans limite"}`, row.rate === null ? "" : `${row.rate} %`] }))}
          />
        )}
      </Section>

      <Section id="stats-planning" title="Planning" intro="Changements apportés à la semaine type, mois par mois.">
        <Table
          caption="Changements du planning par mois"
          head={["Mois", "Annulées", "Exceptionnelles", "Fermetures"]}
          rows={planning.map((row) => ({ key: row.month, cells: [monthLabel(row.month), row.cancel, row.extra, row.closure] }))}
        />
      </Section>

      <Section id="stats-content" title="Pages à mettre à jour" intro="Pages publiées, de la plus ancienne mise à jour à la plus récente. Au-delà de 6 mois, vérifiez que tout est encore juste.">
        <Table
          caption="Dernière mise à jour des pages publiées"
          head={["Page", "Dernière mise à jour", "État"]}
          rows={content.map((row) => ({
            key: row.slug,
            cells: [
              <Link key="link" href={`/${row.slug}`} target="_blank">{row.title}</Link>,
              dateLabel(row.updatedAt),
              row.stale ? <span key="stale" className="status-badge status-badge--draft">À revoir</span> : "À jour",
            ],
          }))}
        />
      </Section>

      <Section id="stats-team" title="Activité de l’équipe" intro={`Publications et modifications de contenus en ligne sur ${ACTIVITY_DAYS} jours.`}>
        {team.length === 0 ? (
          <p className="admin-empty-state">Aucune publication sur la période.</p>
        ) : (
          <Table
            caption="Activité de l’équipe"
            head={["Personne", "Pages", "Actualités", "Total"]}
            rows={team.map((row) => ({ key: row.name, cells: [row.name, row.pages, row.news, row.total] }))}
          />
        )}
      </Section>

      <Section id="stats-gallery" title="Galerie" intro={`${works.byKind.image} photos, ${works.byKind.text} textes, ${works.byKind.pdf} PDF.`}>
        <BarList label="Créations par atelier" rows={works.byWorkshop.map((row) => ({ label: row.label, value: row.count }))} />
      </Section>
    </div>
  );
}
