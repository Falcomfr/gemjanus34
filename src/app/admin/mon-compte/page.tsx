import { MyNameForm, MyPasswordForm } from "@/components/admin/my-account-forms";
import { requireProfile } from "@/lib/auth/require-profile";
import { roleLabels } from "@/lib/auth/roles";
import { createServerClient } from "@/lib/supabase/server";

export default async function MyAccountPage() {
  const profile = await requireProfile();
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();

  return (
    <div className="admin-pages-index">
      <header className="admin-page-header">
        <p className="eyebrow eyebrow--dark">{roleLabels[profile.role]}</p>
        <h1>Mon compte</h1>
        <p>{data.user?.email}</p>
      </header>
      <section className="admin-form-section account-create" aria-labelledby="my-name-title">
        <h2 id="my-name-title">Mon nom</h2>
        <MyNameForm displayName={profile.displayName} />
      </section>
      <section className="admin-form-section account-create" aria-labelledby="my-password-title">
        <h2 id="my-password-title">Mot de passe</h2>
        <MyPasswordForm />
      </section>
    </div>
  );
}
