import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="admin-dashboard">
      <header className="admin-page-header">
        <p className="eyebrow eyebrow--dark">Erreur 404</p>
        <h1>Élément introuvable</h1>
        <p>Cette page de l’administration n’existe pas, ou l’élément a été supprimé.</p>
      </header>
      <p>
        <Link className="text-link" href="/admin">Retour au tableau de bord</Link>
      </p>
    </div>
  );
}
