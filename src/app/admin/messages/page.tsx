import { Mail } from "lucide-react";
import { MessageActions } from "@/components/admin/message-actions";
import { requireProfile } from "@/lib/auth/require-profile";
import { createServerClient } from "@/lib/supabase/server";

const dateTimeFormat = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});

export default async function AdminMessagesPage() {
  await requireProfile();
  const supabase = await createServerClient();
  const { data: messages, error } = await supabase
    .from("contact_messages")
    .select("id, name, email, subject, message, created_at, handled_at")
    .order("created_at", { ascending: false });

  const unread = (messages ?? []).filter((message) => !message.handled_at).length;

  return (
    <div className="admin-pages-index admin-messages">
      <header className="admin-page-header">
        <p className="eyebrow eyebrow--dark">Contact</p>
        <h1>Messages</h1>
        <p>
          Les demandes envoyées depuis le formulaire du site.{" "}
          {unread > 0 ? `${unread} à traiter.` : "Aucune demande en attente."} Pensez à supprimer
          un message une fois la demande traitée (au plus tard au bout de 3 ans).
        </p>
      </header>

      {error ? <p className="form-status form-status--error">Les messages n’ont pas pu être chargés.</p> : null}
      {!error && messages?.length === 0 ? <p className="admin-empty-state">Aucun message reçu pour le moment.</p> : null}

      {messages && messages.length > 0 ? (
        <ul className="admin-messages__list">
          {messages.map((message) => (
            <li key={message.id}>
              <article
                className={message.handled_at ? "admin-message" : "admin-message admin-message--new"}
                aria-labelledby={`message-${message.id}`}
              >
                <header>
                  <span className={`status-badge ${message.handled_at ? "status-badge--archived" : "status-badge--draft"}`}>
                    {message.handled_at ? "Traité" : "Nouveau"}
                  </span>
                  <h2 id={`message-${message.id}`}>{message.subject}</h2>
                  <p>
                    {message.name} · <a href={`mailto:${message.email}`}>{message.email}</a> ·{" "}
                    <time dateTime={message.created_at}>{dateTimeFormat.format(new Date(message.created_at))}</time>
                  </p>
                </header>
                <p className="admin-message__body">{message.message}</p>
                <div className="admin-message__footer">
                  <a
                    className="button button--light admin-button--outlined"
                    href={`mailto:${message.email}?subject=${encodeURIComponent(`Re : ${message.subject}`)}`}
                  >
                    <Mail aria-hidden="true" size={18} />
                    Répondre par e-mail
                  </a>
                  <MessageActions id={message.id} handled={Boolean(message.handled_at)} />
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
