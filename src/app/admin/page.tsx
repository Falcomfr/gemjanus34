import { FileText, Mail, Newspaper } from "lucide-react";

const summaries = [
  { label: "Pages", detail: "Gérer les contenus du site", icon: FileText },
  { label: "Actualités", detail: "Préparer les prochaines publications", icon: Newspaper },
  { label: "Messages", detail: "Consulter les demandes reçues", icon: Mail },
];

export default function AdminPage() {
  return (
    <div className="admin-dashboard">
      <header className="admin-page-header">
        <p className="eyebrow eyebrow--dark">Janus34</p>
        <h1>Dashboard</h1>
        <p>Retrouvez ici les outils de gestion du site.</p>
      </header>
      <section aria-labelledby="admin-shortcuts-title">
        <h2 id="admin-shortcuts-title">Accès rapides</h2>
        <div className="admin-summary-list">
          {summaries.map(({ label, detail, icon: Icon }) => (
            <article className="admin-summary" key={label}>
              <Icon aria-hidden="true" size={24} />
              <div>
                <h3>{label}</h3>
                <p>{detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
