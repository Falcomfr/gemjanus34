import { addDays, currentMonday } from "../src/lib/planning/week";
import { expect, test, type Page } from "@playwright/test";

// These journeys need the local Supabase stack (supabase start) and its variables at build time.
test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL, "Supabase is not configured");
test.describe.configure({ mode: "serial" });

const email = "admin@gemjanus34.local";
const password = "local-development-only";

async function login(page: Page) {
  await page.goto("/admin/connexion");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Tableau de bord" })).toBeVisible();
}

test("a wrong password keeps the e-mail address", async ({ page }) => {
  await page.goto("/admin/connexion");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill("mauvais");
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page.locator(".admin-login__error")).toContainText("incorrect");
  await expect(page.getByLabel("Adresse e-mail")).toHaveValue(email);
});

test("every admin section opens and the site is one click away", async ({ page }) => {
  await login(page);
  const navigation = page.getByRole("navigation", { name: "Navigation de l’administration" });

  for (const name of ["Pages", "Actualités", "Documents", "Messages", "Tableau de bord"]) {
    await navigation.getByRole("link", { name }).click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");
  }
  await expect(page.getByRole("link", { name: /voir le site/i }).first()).toHaveAttribute("href", "/");
});

test("an uploaded document shows on the matching page, then can be removed", async ({ page, request }) => {
  const title = `Document E2E ${Date.now()}`;
  await login(page);
  await page.goto("/admin/documents");
  await page.getByLabel("Titre").fill(title);
  await page.getByLabel("Description").fill("Document envoyé par le test de bout en bout.");
  await page.getByLabel("Catégorie").selectOption("institutional");
  await page.getByLabel("Date du document").fill("2030-01-15");
  await page.getByLabel(/fichier pdf/i).setInputFiles("public/documents/regles-de-vie.pdf");
  await page.getByRole("button", { name: "Mettre en ligne" }).click();
  await expect(page.getByRole("status")).toContainText("est en ligne");

  await page.goto("/qui-sommes-nous");
  const item = page.getByRole("listitem").filter({ hasText: title });
  await item.getByText("Afficher le document").click();
  const frame = item.locator("iframe");
  await expect(frame).toBeVisible();
  const storageUrl = (await frame.getAttribute("src"))!;
  await expect.poll(() => page.frames().some((child) => child.url() === storageUrl)).toBe(true);
  const link = item.getByRole("link", { name: `Télécharger ${title} (PDF)` });
  await expect(link).toBeVisible();
  const pdf = await request.get((await link.getAttribute("href"))!);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toContain("application/pdf");

  await page.goto("/admin/documents");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: `Supprimer ${title}` }).click();
  await expect(page.getByText(title)).toHaveCount(0);
  await page.goto("/qui-sommes-nous");
  await expect(page.getByText(title)).toHaveCount(0);
});

test("a visitor message reaches the admin inbox and can be handled", async ({ page }) => {
  const subject = `Test E2E ${Date.now()}`;
  await page.goto("/contact");
  await page.getByLabel("Nom").fill("Visiteur de test");
  await page.getByLabel("Adresse e-mail").fill("visiteur@example.test");
  await page.getByLabel("Objet").fill(subject);
  await page.getByRole("textbox", { name: "Message" }).fill("Bonjour, ceci est un message envoyé par le test.");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Envoyer le message" }).click();
  await expect(page.getByRole("status")).toContainText("bien été envoyé");

  await login(page);
  await page.goto("/admin/messages");
  const message = page.getByRole("article", { name: subject });
  await expect(message).toContainText("Nouveau");
  await message.getByRole("button", { name: "Marquer comme traité" }).click();
  await expect(message).toContainText("Traité");

  page.once("dialog", (dialog) => dialog.accept());
  await message.getByRole("button", { name: "Supprimer" }).click();
  await expect(page.getByRole("article", { name: subject })).toHaveCount(0);
});

test("logging out in one browser keeps the other one signed in", async ({ browser }) => {
  const first = await browser.newPage();
  const second = await browser.newPage({ storageState: undefined });
  await login(first);
  await login(second);

  await first.getByRole("button", { name: "Déconnexion" }).click();
  await expect(first).toHaveURL(/\/admin\/connexion$/);

  await second.goto("/admin/documents");
  await expect(second.getByRole("heading", { level: 1, name: "Documents" })).toBeVisible();
});

test("a published news item shows on the public pages at once, and leaves when archived", async ({ page }) => {
  const title = `Sortie E2E ${Date.now()}`;
  await login(page);
  await page.goto("/admin/actualites/nouvelle");
  await page.getByLabel("Titre").fill(title);
  await page.getByLabel("Résumé").fill("Une sortie créée par le test de bout en bout.");
  await page.getByLabel("Date et heure de début").fill("2030-03-10T14:00");
  await page.getByRole("button", { name: "Créer le brouillon" }).click();
  await page.waitForURL(/\/admin\/actualites\/[0-9a-f-]{36}$/);
  await page.getByRole("button", { name: "Publier" }).click();
  await expect(page.locator(".form-status--success").last()).toContainText(/publiée/);

  await page.goto("/actualites");
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  await page.goto("/admin/actualites");
  await page.getByRole("link", { name: `Ouvrir ${title}` }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Archiver" }).click();
  await expect(page.locator(".form-status--success").last()).toContainText(/archivée/i);

  await page.goto("/actualites");
  await expect(page.getByRole("heading", { name: title })).toHaveCount(0);
});

async function openPage(page: Page, title: string) {
  await page.goto("/admin/pages");
  await page.getByRole("link", { name: title, exact: true }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

test("pasting coloured text keeps it, and a published page is corrected live", async ({ page }) => {
  // Works on its own page so the site's real content is never touched.
  const slug = `collage-e2e-${Date.now()}`;
  await login(page);
  await page.goto("/admin/pages/nouveau");
  await page.getByLabel("Titre").fill("Collage E2E");
  await page.getByLabel("Adresse de la page").fill(slug);
  await page.getByRole("button", { name: "Créer la page" }).click();
  await page.waitForURL(/\/admin\/pages\/[0-9a-f-]{36}$/);
  await page.getByRole("button", { name: "Publier" }).click();
  await expect(page.locator(".form-status--success")).toContainText(/publiée/);

  await page.locator(".tiptap").click();
  await page.evaluate(() => {
    const target = document.querySelector(".tiptap")!;
    const data = new DataTransfer();
    data.setData("text/html", '<p><span style="color:#ff0000">Texte collé</span></p>');
    data.setData("text/plain", "Texte collé");
    target.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
  });
  await page.keyboard.type(" puis tapé");
  await page.getByRole("button", { name: "Enregistrer et mettre en ligne" }).click();
  await expect(page.locator(".form-status--success")).toContainText("Modifications en ligne");

  await page.goto(`/${slug}`);
  await expect(page.getByText("Texte collé puis tapé")).toBeVisible();

  await openPage(page, "Collage E2E");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Archiver" }).click();
  await expect(page.locator(".form-status--success")).toContainText(/archivée/i);
});

test("a page created and published in the admin appears in the footer site map", async ({ page }) => {
  const slug = `page-e2e-${Date.now()}`;
  await login(page);
  await page.goto("/admin/pages/nouveau");
  await page.getByLabel("Titre").fill("Page de test E2E");
  await page.getByLabel("Adresse de la page").fill(slug);
  await page.getByRole("button", { name: "Créer la page" }).click();
  await page.waitForURL(/\/admin\/pages\/[0-9a-f-]{36}$/);
  await page.getByRole("button", { name: "Publier" }).click();
  await expect(page.locator(".form-status--success")).toContainText(/publiée/);

  await page.goto("/contact");
  await expect(page.getByRole("navigation", { name: "Plan du site" }).getByRole("link", { name: "Page de test E2E" }))
    .toHaveAttribute("href", `/${slug}`);

  await openPage(page, "Page de test E2E");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Archiver" }).click();
  await expect(page.locator(".form-status--success")).toContainText(/archivée/i);
});

test("a slot added in the admin planning shows on the site and the printable version, then can be deleted", async ({ page }) => {
  await login(page);
  await page.goto("/admin/planning");
  const wednesday = page.getByRole("region", { name: "Mercredi" });
  await wednesday.getByText("Ajouter un créneau le mercredi").click();
  const addForm = wednesday.locator("details.planning-admin__add:not(.planning-admin__slot-line) form");
  await addForm.getByLabel("Début").fill("16:30");
  await addForm.getByLabel("Fin").fill("17:30");
  await addForm.getByLabel("Activité").fill("Atelier E2E");
  await addForm.getByLabel("Animé par").fill("Testeuse");
  await addForm.getByLabel("Famille").selectOption("echanger");
  await addForm.getByRole("button", { name: "Ajouter le créneau" }).click();
  await expect(addForm.getByRole("status")).toContainText("Créneau ajouté");

  await page.goto("/actualites");
  const publicWednesday = page.getByRole("region", { name: /^mercredi/i });
  await expect(publicWednesday).toContainText("Atelier E2E");
  await expect(publicWednesday).toContainText("avec Testeuse");
  await page.goto("/planning/imprimer");
  await expect(page.getByText("Atelier E2E")).toBeVisible();

  await page.goto("/admin/planning");
  await page.getByText("16 h 30 – 17 h 30 · Atelier E2E").click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Supprimer Atelier E2E" }).click();
  await expect(page.getByRole("button", { name: "Supprimer Atelier E2E" })).toHaveCount(0);
  await page.goto("/actualites");
  await expect(page.getByText("Atelier E2E")).toHaveCount(0);
});

test("the team cancels, closes and adds sessions on given dates, and the site follows", async ({ page }) => {
  const monday = addDays(currentMonday(new Date().toISOString()), 7);
  await login(page);
  await page.goto("/admin/planning");
  const changes = page.getByRole("region", { name: "Changements à venir" });
  const panel = (summary: string) => changes.locator("details", { hasText: summary }).locator("form");

  await changes.getByText("Annuler une séance").click();
  const cancel = panel("Annuler une séance");
  await cancel.getByLabel("Séance").selectOption({ label: "Mardi · 14 h 30 · Qi Gong" });
  await cancel.getByLabel("Date").fill(addDays(monday, 1));
  await cancel.getByLabel(/^Motif/).fill("Absence E2E");
  await cancel.getByRole("button", { name: "Annuler la séance" }).click();
  await expect(cancel.getByRole("status")).toContainText("Séance annulée");

  await cancel.getByLabel("Séance").selectOption({ label: "Jeudi · 15 h · Yoga en douceur" });
  await cancel.getByLabel("Date").fill(addDays(monday, 3));
  await cancel.getByLabel("Masquée").check();
  await cancel.getByRole("button", { name: "Annuler la séance" }).click();
  await expect(changes.getByRole("listitem").filter({ hasText: "Yoga en douceur" })).toContainText("Annulée, masquée");

  await changes.getByText("Fermer le GEM").click();
  const closure = panel("Fermer le GEM");
  await closure.getByLabel("Du").fill(addDays(monday, 4));
  await closure.getByLabel(/^Motif/).fill("Fermeture E2E");
  await closure.getByRole("button", { name: "Enregistrer la fermeture" }).click();
  await expect(closure.getByRole("status")).toContainText("Fermeture enregistrée");

  await changes.getByText("Ajouter une séance exceptionnelle").click();
  const extra = panel("Ajouter une séance exceptionnelle");
  await extra.getByLabel("Date").fill(addDays(monday, 2));
  await extra.getByLabel("Début").fill("10:00");
  await extra.getByLabel("Fin").fill("11:00");
  await extra.getByLabel("Activité").fill("Séance E2E");
  await extra.getByRole("button", { name: "Ajouter la séance" }).click();
  await expect(extra.getByRole("status")).toContainText("Séance exceptionnelle ajoutée");

  await page.goto(`/actualites?semaine=${monday}`);
  const qiGong = page.getByRole("region", { name: /^mardi/i }).locator("li", { hasText: "Qi Gong" });
  await expect(qiGong).toHaveClass(/planning-slot--cancelled/);
  await expect(qiGong).toContainText("Absence E2E");
  await expect(page.getByRole("region", { name: /^jeudi/i })).not.toContainText("Yoga en douceur");
  await expect(page.getByRole("region", { name: /^vendredi/i })).toContainText("GEM fermé");
  await expect(page.getByRole("region", { name: /^vendredi/i })).toContainText("Fermeture E2E");
  await expect(page.getByRole("region", { name: /^mercredi/i }).locator("li", { hasText: "Séance E2E" })).toContainText("Exceptionnel");
  await page.getByRole("link", { name: /version imprimable/i }).click();
  await expect(page).toHaveURL(new RegExp(`/planning/imprimer\\?semaine=${monday}$`));
  await expect(page.getByText("Séance E2E")).toBeVisible();

  await page.goto("/admin/planning");
  page.on("dialog", (dialog) => dialog.accept());
  for (const what of ["Qi Gong", "Yoga en douceur", "GEM fermé", "Séance E2E"]) {
    const remove = changes.getByRole("button", { name: new RegExp(`^Supprimer : .*${what}`) });
    await remove.click();
    await expect(remove).toHaveCount(0);
  }
  await page.goto(`/actualites?semaine=${monday}`);
  await expect(page.getByText("Séance E2E")).toHaveCount(0);
  await expect(page.getByRole("region", { name: /^jeudi/i })).toContainText("Yoga en douceur");
});

test("an administrator manages an account from creation to deletion", async ({ page, browser }) => {
  const stamp = Date.now();
  const email = `e2e-${stamp}@gemjanus34.local`;
  const name = `Compte E2E ${stamp}`;
  await login(page);
  await page.goto("/admin/comptes");
  const create = page.locator(".account-create");
  await create.getByLabel("Adresse e-mail").fill(email);
  await create.getByLabel("Nom affiché").fill(name);
  await create.getByRole("button", { name: "Créer le compte" }).click();
  const temporary = (await create.locator(".account-password code").textContent())!.trim();
  expect(temporary).toMatch(/^[A-Za-z0-9-]{14,}$/);

  const other = await browser.newPage();
  await other.goto("/admin/connexion");
  await other.getByLabel("Adresse e-mail").fill(email);
  await other.getByLabel("Mot de passe").fill(temporary);
  await other.getByRole("button", { name: "Se connecter" }).click();
  await expect(other.getByRole("heading", { level: 1, name: "Tableau de bord" })).toBeVisible();
  await expect(other.getByRole("link", { name: "Comptes" })).toHaveCount(0);
  await other.getByRole("link", { name: /mon compte/i }).click();
  await other.getByLabel("Mot de passe actuel").fill(temporary);
  await other.getByLabel("Nouveau mot de passe", { exact: true }).fill("un-nouveau-mot-de-passe");
  await other.getByLabel("Confirmer le nouveau mot de passe").fill("un-nouveau-mot-de-passe");
  await other.getByRole("button", { name: "Changer le mot de passe" }).click();
  await expect(other.getByRole("status")).toContainText("Mot de passe modifié");

  await page.reload();
  const row = page.getByRole("article", { name });
  await row.getByLabel("Compte actif").uncheck();
  await row.getByRole("button", { name: "Enregistrer" }).click();
  await expect(row.getByRole("status")).toContainText("Compte modifié");

  const third = await browser.newPage();
  await third.goto("/admin/connexion");
  await third.getByLabel("Adresse e-mail").fill(email);
  await third.getByLabel("Mot de passe").fill("un-nouveau-mot-de-passe");
  await third.getByRole("button", { name: "Se connecter" }).click();
  await expect(third.locator(".admin-login__error")).toContainText("désactivé");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("article", { name }).getByRole("button", { name: "Supprimer" }).click();
  await expect(page.getByRole("article", { name })).toHaveCount(0);
});

test("a photo and a PDF inserted from the editor show on the public page", async ({ page }) => {
  const slug = `medias-e2e-${Date.now()}`;
  await login(page);
  await page.goto("/admin/pages/nouveau");
  await page.getByLabel("Titre").fill("Médias E2E");
  await page.getByLabel("Adresse de la page").fill(slug);
  await page.getByRole("button", { name: "Créer la page" }).click();
  await page.waitForURL(/\/admin\/pages\/[0-9a-f-]{36}$/);
  await page.getByRole("button", { name: "Publier" }).click();
  await expect(page.locator(".form-status--success")).toContainText(/publiée/);

  await page.locator(".tiptap").click();
  page.once("dialog", (dialog) => dialog.accept("Une mire de couleurs"));
  const photoChooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Insérer une photo" }).click();
  await (await photoChooser).setFiles("tests/fixtures/photo-2400.jpg");
  await expect(page.locator(".tiptap img[data-page-media]")).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept("Règles de vie"));
  const pdfChooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Joindre un PDF" }).click();
  await (await pdfChooser).setFiles("public/documents/compte-rendu-ag-2025.pdf");
  await expect(page.locator(".tiptap a", { hasText: "Règles de vie" })).toBeVisible();

  await page.getByRole("button", { name: "Enregistrer et mettre en ligne" }).click();
  await expect(page.locator(".form-status--success")).toContainText("Modifications en ligne");

  await page.goto(`/${slug}`);
  const photo = page.getByRole("img", { name: "Une mire de couleurs" });
  await photo.scrollIntoViewIfNeeded();
  await expect.poll(() => photo.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(1600);
  await expect(page.locator(".content-document__title")).toHaveText("Règles de vie");
  await expect(page.getByText(/Afficher le document/)).toBeVisible();

  await openPage(page, "Médias E2E");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Archiver" }).click();
  await expect(page.locator(".form-status--success")).toContainText(/archivée/i);
});
