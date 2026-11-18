export type ContactAlert = {
  kind: "message" | "callback";
  name: string;
  email?: string;
  phone?: string;
  subject: string;
  message: string;
};

type AlertEnvironment = Record<string, string | undefined>;

/** E-mails the team about a new message. Never throws: the message is already stored. */
export async function sendContactAlert(
  alert: ContactAlert,
  env: AlertEnvironment = process.env,
  fetchFn: typeof fetch = fetch,
): Promise<void> {
  const { RESEND_API_KEY: apiKey, ALERT_FROM_EMAIL: from, CONTACT_ALERT_EMAIL: to } = env;
  if (!apiKey || !from || !to) return;

  const site = env.NEXT_PUBLIC_SITE_URL || "https://gemjanus34.fr";
  const isCallback = alert.kind === "callback";
  const text = [
    isCallback ? "Nouvelle demande de rappel sur le site." : "Nouveau message sur le site.",
    "",
    `Nom : ${alert.name}`,
    isCallback ? `Téléphone : ${alert.phone}` : `E-mail : ${alert.email}`,
    isCallback ? `Moment préféré : ${alert.message || "non précisé"}` : `Objet : ${alert.subject}`,
    ...(isCallback ? [] : ["", alert.message]),
    "",
    `Voir tous les messages : ${site}/admin/messages`,
  ].join("\n");

  try {
    const response = await fetchFn("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        ...(alert.email ? { reply_to: alert.email } : {}),
        subject: isCallback ? "Site Janus34 : demande de rappel" : `Site Janus34 : ${alert.subject}`,
        text,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) console.error("Contact alert e-mail refused", response.status);
  } catch (error) {
    console.error("Contact alert e-mail failed", error);
  }
}
