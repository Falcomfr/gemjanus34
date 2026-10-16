import { AccountRow, CreateAccountForm } from "@/components/admin/account-forms";
import { requireProfile } from "@/lib/auth/require-profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

export default async function AdminAccountsPage() {
  const me = await requireProfile();

  if (me.role !== "admin") {
    return (
      <div className="admin-dashboard">
        <header className="admin-page-header">
          <h1>Comptes</h1>
          <p>La gestion des comptes est réservée aux administrateurs.</p>
        </header>
      </div>
    );
  }

  const supabase = await createServerClient();
  const [{ data: profiles, error }, { data: users }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, role, active").order("display_name"),
    createAdminClient().auth.admin.listUsers({ perPage: 200 }),
  ]);
  const usersById = new Map((users?.users ?? []).map((user) => [user.id, user]));
  const accounts = (profiles ?? []).map((profile) => ({
    id: profile.id,
    displayName: profile.display_name,
    role: profile.role,
    active: profile.active,
    email: usersById.get(profile.id)?.email ?? "",
    lastSignInAt: usersById.get(profile.id)?.last_sign_in_at ?? null,
  }));

  return (
    <div className="admin-pages-index">
      <header className="admin-page-header">
        <p className="eyebrow eyebrow--dark">Équipe</p>
        <h1>Comptes</h1>
        <p>
          Les personnes qui peuvent se connecter à l’administration. Un éditeur gère les contenus ; un
          administrateur gère aussi les comptes, la publication des pages et les archives.
        </p>
      </header>

      <section className="admin-form-section account-create" aria-labelledby="account-create-title">
        <h2 id="account-create-title">Créer un compte</h2>
        <CreateAccountForm />
      </section>

      {error ? <p className="form-status form-status--error">Les comptes n’ont pas pu être chargés.</p> : null}
      <section className="account-list" aria-label="Comptes existants">
        {accounts.map((account) => (
          <AccountRow key={account.id} account={account} isMe={account.id === me.id} />
        ))}
      </section>
    </div>
  );
}
