import { SettingsForm } from "@/components/admin/settings-form";
import { requireProfile } from "@/lib/auth/require-profile";
import { getSiteSettings } from "@/lib/settings/site-settings";

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

  return (
    <div className="admin-dashboard">
      <header className="admin-page-header">
        <p className="eyebrow eyebrow--dark">Site</p>
        <h1>Réglages</h1>
        <p>Activez ou coupez les fonctions du site. Un changement est visible tout de suite.</p>
      </header>
      <SettingsForm settings={await getSiteSettings()} />
    </div>
  );
}
