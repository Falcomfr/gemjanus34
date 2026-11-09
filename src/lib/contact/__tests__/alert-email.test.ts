import { expect, test, vi } from "vitest";
import { sendContactAlert, type ContactAlert } from "../alert-email";

const env = {
  RESEND_API_KEY: "re_test",
  ALERT_FROM_EMAIL: "Site Janus34 <site@exemple.test>",
  CONTACT_ALERT_EMAIL: "equipe@exemple.test",
};
const message: ContactAlert = {
  kind: "message",
  name: "Camille Martin",
  email: "camille@example.test",
  subject: "Première visite",
  message: "Bonjour, je voudrais venir découvrir le GEM.",
};

test("sends nothing until the three settings are there", async () => {
  const fetchFn = vi.fn();
  for (const missing of Object.keys(env)) {
    await sendContactAlert(message, { ...env, [missing]: "" }, fetchFn);
  }
  expect(fetchFn).not.toHaveBeenCalled();
});

test("e-mails the team a message, answering straight to the visitor", async () => {
  const fetchFn = vi.fn(async () => new Response("{}", { status: 200 }));

  await sendContactAlert(message, env, fetchFn);

  expect(fetchFn).toHaveBeenCalledWith("https://api.resend.com/emails", expect.objectContaining({ method: "POST" }));
  const [, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
  expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_test");
  const body = JSON.parse(init.body as string);
  expect(body).toMatchObject({
    from: "Site Janus34 <site@exemple.test>",
    to: ["equipe@exemple.test"],
    reply_to: "camille@example.test",
    subject: "Site Janus34 : Première visite",
  });
  expect(body.text).toContain("Camille Martin");
  expect(body.text).toContain("Bonjour, je voudrais venir découvrir le GEM.");
  expect(body.text).toContain("/admin/messages");
});

test("a call-me-back request carries the phone number and no reply address", async () => {
  const fetchFn = vi.fn(async () => new Response("{}", { status: 200 }));

  await sendContactAlert({ kind: "callback", name: "Sam", phone: "06 12 34 56 78", subject: "Demande de rappel", message: "Le matin" }, env, fetchFn);

  const [, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
  const body = JSON.parse(init.body as string);
  expect(body.reply_to).toBeUndefined();
  expect(body.subject).toBe("Site Janus34 : demande de rappel");
  expect(body.text).toContain("06 12 34 56 78");
});

test("never fails the visitor when the mail service is down", async () => {
  const logged = vi.spyOn(console, "error").mockImplementation(() => {});
  await expect(sendContactAlert(message, env, vi.fn(async () => { throw new Error("offline"); }))).resolves.toBeUndefined();
  await expect(sendContactAlert(message, env, vi.fn(async () => new Response("nope", { status: 500 })))).resolves.toBeUndefined();
  expect(logged).toHaveBeenCalledTimes(2);
  logged.mockRestore();
});
