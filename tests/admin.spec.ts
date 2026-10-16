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

test("an uploaded planning replaces the previous one on the site, then can be removed", async ({ page, request }) => {
  await login(page);
  await page.goto("/admin/documents");
  await page.getByLabel("Titre").fill("Planning de test E2E");
  await page.getByLabel("Description").fill("Planning envoyé par le test de bout en bout.");
  await page.getByLabel("Catégorie").selectOption("planning");
  await page.getByLabel("Date du document").fill("2030-01-15");
  await page.getByLabel(/fichier pdf/i).setInputFiles("public/documents/regles-de-vie.pdf");
  await page.getByRole("button", { name: "Mettre en ligne" }).click();
  await expect(page.getByRole("status")).toContainText("est en ligne");

  await page.goto("/actualites");
  await expect(page.getByText(/en vigueur depuis le 15 janvier 2030/i)).toBeVisible();
  const href = await page.getByRole("link", { name: /consulter le planning/i }).getAttribute("href");
  const pdf = await request.get(href!);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toContain("application/pdf");

  await page.goto("/admin/documents");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Supprimer Planning de test E2E" }).click();
  await expect(page.getByText("Planning de test E2E")).toHaveCount(0);

  await page.goto("/actualites");
  await expect(page.getByText(/en vigueur depuis le 22 juin 2026/i)).toBeVisible();
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
