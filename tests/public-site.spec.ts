import { expect, test } from "@playwright/test";

const publicRoutes = [
  { path: "/", heading: "Janus34" },
  { path: "/qui-sommes-nous", heading: "Qui sommes-nous ?" },
  { path: "/activites", heading: "Activités" },
  { path: "/actualites", heading: "Planning et actualités" },
  { path: "/nous-rejoindre", heading: "Nous rejoindre" },
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

for (const route of publicRoutes) {
  test(`${route.path} remains usable at 320px`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(route.path);

    await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });
}

test("home remains usable on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "Janus34" })).toBeVisible();
  await expect(page.getByRole("link", { name: /voir le planning/i })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});

test("mobile menu opens", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");

  await page.getByText("Menu", { exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Navigation mobile" })).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Navigation mobile" }).getByRole("link", {
      name: "Contact",
    }),
  ).toBeVisible();
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

test("public responses include baseline security headers", async ({ request }) => {
  for (const route of publicRoutes) {
    const response = await request.get(route.path);
    const headers = response.headers();

    expect(headers["content-security-policy"]).toContain("default-src 'self'");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["permissions-policy"]).toContain("camera=()");
  }
});
