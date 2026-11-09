import { SettingsForm } from "@/components/admin/settings-form";
import { requireProfile } from "@/lib/auth/require-profile";
import { readSiteSettings } from "@/lib/settings/site-settings";

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
        <SettingsForm settings={settings} />
      ) : (
        <p className="form-status form-status--error" role="alert">
          Les réglages n’ont pas pu être chargés. Rechargez la page dans un instant.
        </p>
      )}
    </div>
  );
}
