import Link from "next/link";
import { ConferenceForm, DeleteConferenceButton, DeleteRegistrationButton } from "@/components/admin/conference-forms";
import { requireProfile } from "@/lib/auth/require-profile";
import { formatPublicDateRange } from "@/lib/date/public-date";
import { getSiteSettings } from "@/lib/settings/site-settings";
import { createServerClient } from "@/lib/supabase/server";

// Registrations are kept until the conference is over, three months at most (privacy page).
const KEEP_MS = 92 * 86_400_000;

export default async function AdminConferencesPage() {
  const profile = await requireProfile();
  const supabase = await createServerClient();
  const [{ data: conferences, error }, settings] = await Promise.all([
    supabase
      .from("conferences")
      .select("id, title, speaker, starts_at, place, description, capacity, conference_registrations(id, name, contact, seats, created_at)")
      .order("starts_at"),
    getSiteSettings(),
  ]);
  const now = new Date().getTime();

  return (
    <div className="admin-pages-index">
      <header className="admin-page-header">
        <p className="eyebrow eyebrow--dark">Contenu</p>
        <h1>Conférences</h1>
        <p>Le programme du cycle et les inscriptions reçues. Supprimer une conférence supprime aussi ses inscriptions.</p>
        {settings.conferencesEnabled ? null : (
          <p className="admin-notice">
            La page Conférences n’est pas encore visible sur le site.{" "}
            {profile.role === "admin" ? <Link href="/admin/reglages">Activez-la dans Réglages</Link> : "Un administrateur l’activera dans Réglages"}.
          </p>
        )}
      </header>

      <section className="admin-form-section" aria-labelledby="conference-add-title">
        <div className="admin-form-section__heading">
          <h2 id="conference-add-title">Ajouter une conférence</h2>
        </div>
        <ConferenceForm />
      </section>

      {error ? <p className="form-status form-status--error">Les conférences n’ont pas pu être chargées.</p> : null}
      {!error && conferences?.length === 0 ? <p className="admin-empty-state">Aucune conférence au programme.</p> : null}
      {(conferences ?? []).map((conference) => {
        const registrations = conference.conference_registrations ?? [];
        const taken = registrations.reduce((total, registration) => total + registration.seats, 0);
        const stale = now - new Date(conference.starts_at).getTime() > KEEP_MS;
        return (
          <article className="admin-conference" key={conference.id} aria-labelledby={`conference-${conference.id}`}>
            <header>
              <div>
                <h2 id={`conference-${conference.id}`}>{conference.title}</h2>
                <p>
                  {formatPublicDateRange(conference.starts_at, null)} · {conference.place}
                  {conference.speaker ? ` · ${conference.speaker}` : ""}
                </p>
                <p>
                  {taken} {taken > 1 ? "places prises" : "place prise"}
                  {conference.capacity ? ` sur ${conference.capacity}` : " (sans limite)"}
                  {stale ? " · passée depuis plus de 3 mois : à supprimer" : ""}
                </p>
              </div>
              <DeleteConferenceButton id={conference.id} title={conference.title} />
            </header>
            {registrations.length ? (
              <table className="admin-conference__table">
                <thead>
                  <tr>
                    <th scope="col">Nom</th>
                    <th scope="col">Contact</th>
                    <th scope="col">Places</th>
                    <th scope="col"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((registration) => (
                    <tr key={registration.id}>
                      <td>{registration.name}</td>
                      <td>{registration.contact}</td>
                      <td>{registration.seats}</td>
                      <td><DeleteRegistrationButton id={registration.id} name={registration.name} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="admin-empty-state">Aucune inscription pour le moment.</p>
            )}
          </article>
        );
      })}
    </div>
  );
}
