import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 320, height: 720 },
  { width: 1440, height: 900 },
]) {
  test(`home remains usable at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: /janus34/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /voir le planning/i })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });
}

test("legacy join URL redirects to the new page", async ({ page }) => {
  await page.goto("/nous-contacter/devenir-adherent/");
  await expect(page).toHaveURL(/\/nous-rejoindre$/);
});
