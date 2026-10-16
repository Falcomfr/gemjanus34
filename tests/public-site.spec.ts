import { expect, test } from "@playwright/test";

const publicRoutes = [
  { path: "/", heading: "Rompre les solitudes, créer des liens" },
  { path: "/qui-sommes-nous", heading: "Le GEM Janus34" },
  { path: "/activites", heading: "Activités" },
  { path: "/actualites", heading: "Planning et actualités" },
  { path: "/nous-rejoindre", heading: "Préparer une première visite" },
  { path: "/ressources", heading: "Ressources" },
  { path: "/contact", heading: "Contact" },
  { path: "/mentions-legales", heading: "Mentions légales" },
  { path: "/confidentialite", heading: "Confidentialité" },
] as const;

const legacyRedirects = [
  ["/nous-contacter", "/nous-rejoindre"],
  ["/nous-contacter/devenir-adherent", "/nous-rejoindre"],
  ["/nos-objectifs-2", "/qui-sommes-nous"],
  ["/nos-objectifs-2/les-activites", "/activites"],
  ["/le-trouble-bipolaire-2", "/ressources"],
  ["/le-trouble-bipolaire-2/video-conferences", "/ressources"],
  ["/le-trouble-bipolaire-2/sites-internet", "/ressources"],
  ["/evenements", "/actualites"],
  ["/actualites-2__trashed/samedi", "/actualites"],
  ["/actualites-2__trashed/conferences", "/actualites"],
] as const;

const forbiddenWording = /importé|ancien site|mise à jour éditoriale|contenu provisoire|en attente de validation/i;

for (const width of [320, 768, 1440]) {
  for (const route of publicRoutes) {
    test(`${route.path} remains usable at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(route.path);

      await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflow).toBe(false);
      await expect(page.locator("body")).not.toContainText(forbiddenWording);
    });
  }
}

test("understand the GEM from the home page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  await page.getByRole("link", { name: "Découvrir Janus34" }).click();

  await expect(page).toHaveURL("/qui-sommes-nous");
  await expect(page.getByRole("heading", { level: 2, name: "Un lieu d'entraide, distinct du soin" })).toBeVisible();
});

test("find the planning in one action and open it", async ({ page, request }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");

  await page.getByRole("navigation", { name: "Accès rapides" }).getByRole("link", { name: /le planning/i }).click();

  await expect(page).toHaveURL("/actualites#planning");
  const pdf = page.getByRole("link", { name: /consulter le planning \(pdf\)/i });
  await expect(pdf).toBeInViewport();
  const response = await request.get((await pdf.getAttribute("href"))!);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/pdf");
});

test("call the association from a phone without opening the menu", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });

  for (const path of ["/", "/activites", "/contact"]) {
    await page.goto(path);
    await expect(page.locator('a[href="tel:+33467048768"]:visible').first()).toBeVisible();
  }
});

test("prepare a visit from the mobile menu", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");

  await page.getByText("Menu", { exact: true }).click();
  const navigation = page.getByRole("navigation", { name: "Navigation mobile" });
  await expect(navigation.getByRole("link", { name: /04 67 04 87 68/ })).toBeVisible();
  await navigation.getByRole("link", { name: "Première visite" }).click();

  await expect(page).toHaveURL("/nous-rejoindre");
  await expect(navigation).toBeHidden();
  const practical = page.getByRole("region", { name: "Informations pratiques" });
  await expect(practical).toContainText("405 rue des Grèzes");
  await expect(practical).toContainText("Bus 11, arrêt La Martelle");
});

test("every published document is downloadable", async ({ page, request }) => {
  for (const path of ["/qui-sommes-nous", "/ressources"]) {
    await page.goto(path);
    const links = await page.locator('a[href^="/documents/"]').evaluateAll((anchors) =>
      anchors.map((anchor) => anchor.getAttribute("href")!),
    );
    expect(links.length).toBeGreaterThan(0);
    for (const href of links) {
      expect((await request.get(href)).status(), href).toBe(200);
    }
  }
});

for (const [source, destination] of legacyRedirects) {
  test(`${source} permanently redirects to ${destination}`, async ({ request, baseURL }) => {
    const response = await request.get(source, { maxRedirects: 0 });

    expect(response.status()).toBe(308);
    expect(new URL(response.headers().location, baseURL).pathname).toBe(destination);
  });
}

test("sitemap lists every public route", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.ok()).toBe(true);
  const body = await response.text();

  for (const route of publicRoutes) {
    const suffix = route.path === "/" ? "" : route.path;
    expect(body).toContain(`<loc>https://gemjanus34.fr${suffix}</loc>`);
  }
  expect(body.match(/<loc>/g)).toHaveLength(publicRoutes.length);
});

test("robots allows the public site and protects administration", async ({ request }) => {
  const response = await request.get("/robots.txt");
  expect(response.ok()).toBe(true);

  await expect(response.text()).resolves.toBe(
    "User-Agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: https://gemjanus34.fr/sitemap.xml\n",
  );
});

test("all public responses include every configured security header", async ({ request }) => {
  const securedPaths = [...publicRoutes.map((route) => route.path), "/sitemap.xml", "/robots.txt"];

  for (const path of securedPaths) {
    const response = await request.get(path);
    const headers = response.headers();

    expect(headers["content-security-policy"]).toContain("default-src 'self'");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["permissions-policy"]).toBe(
      "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
    );
  }
});
