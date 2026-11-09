import { SettingsForm } from "@/components/admin/settings-form";
import { ThemeForm } from "@/components/admin/theme-form";
import { requireProfile } from "@/lib/auth/require-profile";
import { readSiteSettings } from "@/lib/settings/site-settings";
import { defaultTheme, themeSchema } from "@/lib/settings/theme";

export default async function AdminSettingsPage() {
  const me = await requireProfile();
  if (me.role !== "admin") {
    return (
      <div className="admin-dashboard">
        <header className="admin-page-header">
          <h1>Réglages</h1>
          <p>Les réglages sont réservés aux administrateurs.</p>
        </header>
      </div>
    );
  }

  // The admin form must show the real values: saving guessed defaults would erase them.
  const settings = await readSiteSettings();
  return (
    <div className="admin-dashboard">
      <header className="admin-page-header">
        <p className="eyebrow eyebrow--dark">Site</p>
        <h1>Réglages</h1>
        <p>Activez ou coupez les fonctions du site. Un changement est visible tout de suite.</p>
      </header>
      {settings ? (
        <>
          <SettingsForm settings={settings} />
          <section className="admin-form-section" aria-labelledby="theme-title">
            <div className="admin-form-section__heading">
              <h2 id="theme-title">Couleurs du site</h2>
              <p>Les nuances plus claires et plus foncées suivent automatiquement. Le site refuse les couleurs qui rendraient le texte difficile à lire.</p>
            </div>
            <ThemeForm theme={themeSchema.safeParse(settings.theme).data ?? defaultTheme} custom={settings.theme !== null} />
          </section>
        </>
      ) : (
        <p className="form-status form-status--error" role="alert">
          Les réglages n’ont pas pu être chargés. Rechargez la page dans un instant.
        </p>
      )}
    </div>
  );
}
