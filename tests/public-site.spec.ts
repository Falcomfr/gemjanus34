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
  ["/janus", "/qui-sommes-nous"],
  ["/samedi", "/actualites"],
  ["/sortir-a-montpellier", "/sorties-culturelles-et-sportives"],
  ["/mentions-legales-et-confidentialite", "/mentions-legales"],
  ["/le-trouble-bipolaire-2/le-trouble-bipolaire", "/ressources"],
  ["/nos-objectifs-2/les-activites/mobilisation-corporelle", "/activites"],
  ["/nos-objectifs-2/mentions-legales", "/mentions-legales"],
  ["/nos-objectifs-2/politique-confidentialite", "/confidentialite"],
  ["/nos-objectifs-2/nos-regles-de-vie", "/qui-sommes-nous"],
  ["/nos-objectifs-2/nos-statuts-et-notre-reglement-interieur", "/qui-sommes-nous"],
  ["/nous-contacter/adresse", "/contact"],
  ["/nous-contacter/formulaire-contact", "/contact"],
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

test("find the planning in one action and print it", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");

  await page.getByRole("navigation", { name: "Accès rapides" }).getByRole("link", { name: /le planning/i }).click();

  await expect(page).toHaveURL("/actualites#planning");
  await expect(page.getByRole("heading", { level: 2, name: "Le planning des activités" })).toBeInViewport();
  await page.getByRole("link", { name: /version imprimable/i }).click();
  await expect(page).toHaveURL("/planning/imprimer");
  await expect(page.getByRole("button", { name: /imprimer ou enregistrer en pdf/i })).toBeVisible();
  await expect(page.getByRole("region", { name: /^jeudi/i })).toContainText("Yoga en douceur");

  // Firefox measures 100vh on the printed sheet: a full-height body spilled onto an empty second page.
  await page.emulateMedia({ media: "print" });
  expect(await page.evaluate(() => getComputedStyle(document.body).minHeight)).toBe("0px");
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
  expect(body.match(/<loc>/g)!.length).toBeGreaterThanOrEqual(publicRoutes.length);
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

test("an activity of the planning opens a window with its details", async ({ page }) => {
  await page.goto("/actualites");
  await page.getByRole("button", { name: /yoga en douceur/i }).click();

  const dialog = page.getByRole("dialog", { name: "Yoga en douceur" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(/Jeudi \S+ \S+, 15 h – 16 h 30/);
  await expect(dialog).toContainText("avec Sévérine");
  const box = (await dialog.boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(Math.abs(box.x + box.width / 2 - viewport.width / 2)).toBeLessThan(2);
  expect(Math.abs(box.y + box.height / 2 - viewport.height / 2)).toBeLessThan(2);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("only the site's own PDFs can be framed, by the site itself", async ({ request }) => {
  const headers = (await request.get("/documents/regles-de-vie.pdf")).headers();

  expect(headers["content-security-policy"]).toContain("frame-ancestors 'self'");
  expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
});

function collectCspViolations(page: import("@playwright/test").Page): string[] {
  const violations: string[] = [];
  page.on("console", (message) => {
    if (/Content Security Policy/i.test(message.text())) violations.push(message.text());
  });
  // Third-party players stay offline in tests: only the request they would make matters.
  void page.route(/youtube-nocookie|ytimg|google\.com|vimeo/, (route) => route.abort());
  return violations;
}

test("a video of the resources loads its player only on click", async ({ page }) => {
  const violations = collectCspViolations(page);
  await page.goto("/ressources");

  await expect(page.locator("iframe")).toHaveCount(0);
  await page.getByRole("button", { name: /lire la vidéo : tcc et troubles bipolaires/i }).click();

  await expect(page.locator("iframe")).toHaveAttribute("src", /^https:\/\/www\.youtube-nocookie\.com\/embed\/5PN11L4wXKA/);
  expect(violations).toEqual([]);
});

test("a document opens in its panel with links to open in full and download", async ({ page }) => {
  const violations = collectCspViolations(page);
  await page.goto("/ressources");

  const panel = page.locator(".document-preview").first();
  await panel.getByText("Afficher le document").click();

  const frame = panel.locator("iframe");
  await expect(frame).toBeVisible();
  const src = (await frame.getAttribute("src"))!;
  await expect.poll(() => page.frames().some((child) => child.url().endsWith(src))).toBe(true);
  await expect(panel.getByRole("link", { name: /ouvrir en grand/i })).toHaveAttribute("href", src);
  await expect(panel.getByRole("link", { name: /^télécharger/i })).toHaveAttribute("download", "");
  expect(violations).toEqual([]);
});

test("the contact page shows the Google map on request", async ({ page }) => {
  const violations = collectCspViolations(page);
  await page.goto("/contact");

  await page.getByRole("button", { name: /afficher la carte/i }).click();

  await expect(page.locator("iframe")).toHaveAttribute("src", /^https:\/\/www\.google\.com\/maps\?q=/);
  expect(violations).toEqual([]);
});

test("the planning moves from week to week, within the next eight weeks", async ({ page }) => {
  await page.goto("/actualites");
  const range = page.locator(".week-planning__range");
  const current = await range.textContent();

  await page.getByRole("link", { name: /semaine suivante/i }).click();
  await expect(page).toHaveURL(/\?semaine=\d{4}-\d{2}-\d{2}#planning$/);
  await expect(range).not.toHaveText(current!);
  await page.getByRole("link", { name: /semaine précédente/i }).click();
  await expect(range).toHaveText(current!);
  await expect(page.getByRole("link", { name: /semaine précédente/i })).toHaveCount(0);

  await page.goto("/actualites?semaine=1999-01-04");
  await expect(range).toHaveText(current!);
});

test("on a phone the header stays on top, shrinks once scrolled, and the page does not jump", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/actualites");
  const header = page.getByRole("banner");
  const full = (await header.boundingBox())!.height;
  const heading = page.getByRole("heading", { level: 1 });
  const headingTop = await heading.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);

  await page.mouse.wheel(0, 600);
  await expect(header).toHaveClass(/site-header--compact/);
  await expect.poll(async () => (await header.boundingBox())!.height).toBeLessThan(full - 10);
  expect((await header.boundingBox())!.y).toBe(0);
  await expect.poll(() => heading.evaluate((element) => element.getBoundingClientRect().top + window.scrollY)).toBe(headingTop);

  await page.getByText("Menu", { exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Navigation mobile" }).getByRole("link", { name: "Contact" })).toBeVisible();
});
