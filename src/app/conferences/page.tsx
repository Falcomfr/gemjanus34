import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RegistrationForm } from "@/components/conferences/registration-form";
import { contact } from "@/content/contact";
import { formatPublicDateRange } from "@/lib/date/public-date";
import { getSiteSettings } from "@/lib/settings/site-settings";
import { createServerClient } from "@/lib/supabase/server";
import { fr } from "@/lib/text/french";

export const metadata: Metadata = {
  title: "Conférences",
  description: "Le programme des conférences de Janus34 et l'inscription.",
};

type Conference = { id: string; title: string; speaker: string | null; starts_at: string; place: string; description: string; capacity: number | null };

export default async function ConferencesPage() {
  const settings = await getSiteSettings();
  if (!settings.conferencesEnabled) notFound();

  const supabase = await createServerClient();
  const [{ data }, { data: taken }] = await Promise.all([
    supabase.from("conferences").select("id, title, speaker, starts_at, place, description, capacity").order("starts_at"),
    supabase.rpc("conference_seats_taken"),
  ]);
  const seatsTaken = new Map((taken ?? []).map((row) => [row.conference_id, Number(row.seats)]));
  const now = new Date().getTime();
  const conferences = (data ?? []) as Conference[];
  const upcoming = conferences.filter((conference) => new Date(conference.starts_at).getTime() >= now);
  const past = conferences.filter((conference) => new Date(conference.starts_at).getTime() < now).reverse();

  const card = (conference: Conference, open: boolean) => {
    const left = conference.capacity === null ? null : Math.max(0, conference.capacity - (seatsTaken.get(conference.id) ?? 0));
    return (
      <article className="conference" key={conference.id} aria-labelledby={`conference-${conference.id}`}>
        <h3 id={`conference-${conference.id}`}>{fr(conference.title)}</h3>
        <p className="conference__meta">
          {formatPublicDateRange(conference.starts_at, null)} · {conference.place}
          {conference.speaker ? <> · avec {conference.speaker}</> : null}
        </p>
        {conference.description ? <p>{fr(conference.description)}</p> : null}
        {open ? (
          <>
            {left ? <p className="conference__seats">{left} {left > 1 ? "places restantes" : "place restante"}</p> : null}
            {settings.registrationsEnabled ? (
              <RegistrationForm conferenceId={conference.id} maxSeats={left ?? 4} full={left === 0} />
            ) : left === 0 ? (
              <p className="conference__seats">Complet</p>
            ) : (
              <p>Inscription par téléphone au <a href={contact.phoneHref}>{contact.phone}</a>.</p>
            )}
          </>
        ) : null}
      </article>
    );
  };

  return (
    <article className="content-page">
      <header className="content-page__header">
        <div className="content-container content-page__header-inner">
          <div>
            <p className="eyebrow">La vie du GEM</p>
            <h1>Conférences</h1>
            <p>Des rencontres ouvertes pour mieux comprendre la santé psychique, avec des intervenants invités par Janus34.</p>
          </div>
        </div>
      </header>
      <div className="content-container content-page__body">
        <section aria-labelledby="conferences-upcoming">
          <h2 id="conferences-upcoming">À venir</h2>
          {upcoming.length ? upcoming.map((conference) => card(conference, true)) : <p>Le programme sera annoncé bientôt.</p>}
        </section>
        {past.length ? (
          <section aria-labelledby="conferences-past">
            <h2 id="conferences-past">Conférences passées</h2>
            {past.map((conference) => card(conference, false))}
          </section>
        ) : null}
      </div>
    </article>
  );
}
