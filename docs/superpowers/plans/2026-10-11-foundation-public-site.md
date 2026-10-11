# Gem Janus34 Public Site Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a tested, responsive public Janus34 website backed by a typed content boundary and ready to connect to Supabase without exposing an unfinished administration interface.

**Architecture:** A Next.js App Router application renders public pages as React Server Components. Public components consume a repository interface whose initial implementation uses reviewed local seed content; a Supabase implementation can replace it without changing page components. Shared layout, typography and navigation remain fixed while editors will later control structured content inside those boundaries.

**Tech Stack:** Node.js 24, Next.js 16.4, React 19.3, TypeScript strict, Tailwind CSS 4, Vitest 5, Testing Library, Playwright 1.64, Lucide React.

## Global Constraints

- The public navigation contains exactly: Accueil, Qui sommes-nous ?, Activités, Planning et actualités, Nous rejoindre, Ressources, Contact.
- The layout works at 320 px without horizontal scrolling or overlapping content.
- Address, telephone, planning and joining information are reachable in at most two actions from the home page.
- Do not add an exposed e-mail address to static HTML.
- Do not copy WordPress markup or recreate a free-form page builder.
- Use French interface copy and accessible semantic HTML.
- Use the existing Janus34 logo only after verifying the imported asset visually.
- Preserve room for redirects from legacy WordPress URLs.

---

### Task 1: Application Shell and Test Harness

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.mjs`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `playwright.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `src/components/site-header.tsx`
- Create: `src/components/site-footer.tsx`
- Create: `src/components/__tests__/site-header.test.tsx`

**Interfaces:**
- Produces: `SiteHeader(): JSX.Element`, `SiteFooter(): JSX.Element`, global metadata and test commands used by every later task.

- [ ] **Step 1: Create the package and framework configuration**

Run:

```bash
npm init -y
npm install next@16.4.0 react@19.3.0 react-dom@19.3.0 lucide-react
npm install -D typescript @types/node @types/react @types/react-dom tailwindcss @tailwindcss/postcss vitest@5.0.3 jsdom @testing-library/react @testing-library/jest-dom @vitejs/plugin-react @playwright/test@1.64.0 eslint eslint-config-next
```

Set scripts to:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test"
}
```

- [ ] **Step 2: Write the failing navigation test**

```tsx
// src/components/__tests__/site-header.test.tsx
import { render, screen } from "@testing-library/react";
import { SiteHeader } from "../site-header";

test("exposes the seven public destinations", () => {
  render(<SiteHeader />);
  const links = screen.getAllByRole("link");
  expect(links.map((link) => link.textContent)).toEqual(
    expect.arrayContaining([
      "Accueil",
      "Qui sommes-nous ?",
      "Activités",
      "Planning et actualités",
      "Nous rejoindre",
      "Ressources",
      "Contact",
    ]),
  );
});
```

- [ ] **Step 3: Run the test and verify RED**

Run: `npm test -- src/components/__tests__/site-header.test.tsx`

Expected: FAIL because `src/components/site-header.tsx` does not exist.

- [ ] **Step 4: Implement the semantic shell**

Create `SiteHeader` with a logo/home link, desktop navigation, an accessible mobile disclosure, and a prominent `Nous rejoindre` link. Create `SiteFooter` with address, telephone, legal links and an admin link. `layout.tsx` wraps every route in the header and footer and exports French metadata.

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Nunito_Sans } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const body = Nunito_Sans({ subsets: ["latin"], variable: "--font-body" });
const display = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: { default: "Janus34", template: "%s | Janus34" },
  description: "Groupe d'Entraide Mutuelle à Montpellier.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${body.variable} ${display.variable}`}>
      <body>
        <a className="skip-link" href="#contenu">Aller au contenu</a>
        <SiteHeader />
        <main id="contenu">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Verify the shell**

Run: `npm test -- src/components/__tests__/site-header.test.tsx && npm run typecheck && npm run lint`

Expected: one passing test, typecheck exit 0, lint exit 0.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json next.config.ts tsconfig.json postcss.config.mjs vitest.config.ts vitest.setup.ts playwright.config.ts src
git commit -m "feat: scaffold accessible public shell"
```

### Task 2: Typed Public Content Repository

**Files:**
- Create: `src/content/types.ts`
- Create: `src/content/navigation.ts`
- Create: `src/content/seed.ts`
- Create: `src/lib/content/public-content-repository.ts`
- Create: `src/lib/content/local-public-content-repository.ts`
- Create: `src/lib/content/__tests__/local-public-content-repository.test.ts`

**Interfaces:**
- Produces: `PublicPage`, `NewsItem`, `PublicDocument`, `PublicSiteData` types.
- Produces: `PublicContentRepository` with `getSiteData()`, `getPage(slug)`, `getNews()` and `getDocuments(category?)`.
- Produces: `publicContentRepository` local implementation.

- [ ] **Step 1: Write the failing repository tests**

```ts
// src/lib/content/__tests__/local-public-content-repository.test.ts
import { publicContentRepository } from "../local-public-content-repository";

test("returns only published news in reverse chronological order", async () => {
  const news = await publicContentRepository.getNews();
  expect(news.length).toBeGreaterThan(0);
  expect(news.every((item) => item.status === "published")).toBe(true);
  expect(news.map((item) => item.startsAt)).toEqual(
    [...news.map((item) => item.startsAt)].sort().reverse(),
  );
});

test("returns documents filtered by category", async () => {
  const documents = await publicContentRepository.getDocuments("institutional");
  expect(documents.length).toBeGreaterThan(0);
  expect(documents.every((document) => document.category === "institutional")).toBe(true);
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm test -- src/lib/content/__tests__/local-public-content-repository.test.ts`

Expected: FAIL because the repository module does not exist.

- [ ] **Step 3: Define content contracts and reviewed seed data**

```ts
// src/content/types.ts
export type ContentStatus = "draft" | "published" | "archived";
export type DocumentCategory = "planning" | "institutional" | "health" | "activity";

export type PublicDocument = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: DocumentCategory;
  mimeType: string;
  updatedAt: string;
  downloadUrl: string;
};

export type NewsItem = {
  id: string;
  title: string;
  excerpt: string;
  startsAt: string;
  endsAt: string | null;
  featured: boolean;
  status: ContentStatus;
};

export type PublicPage = {
  slug: string;
  title: string;
  eyebrow?: string;
  introduction: string;
  sections: Array<{ id: string; title: string; body: string }>;
};
```

Populate `seed.ts` with fact-checked summaries derived from the existing site, current address `405 rue des Grèzes`, telephone `04 67 04 87 68`, and clearly marked content dates. Do not invent staff names, schedules or medical advice.

- [ ] **Step 4: Implement the local repository**

```ts
// src/lib/content/public-content-repository.ts
import type { DocumentCategory, NewsItem, PublicDocument, PublicPage } from "@/content/types";

export interface PublicContentRepository {
  getPage(slug: string): Promise<PublicPage | null>;
  getNews(): Promise<NewsItem[]>;
  getDocuments(category?: DocumentCategory): Promise<PublicDocument[]>;
}
```

The local implementation returns cloned records, filters status before returning news, sorts ISO dates descending and filters documents by exact category.

- [ ] **Step 5: Verify repository behavior**

Run: `npm test -- src/lib/content/__tests__/local-public-content-repository.test.ts && npm run typecheck`

Expected: two passing tests and typecheck exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/content src/lib/content
git commit -m "feat: add typed public content repository"
```

### Task 3: Public Home Page

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/home/hero.tsx`
- Create: `src/components/home/current-planning.tsx`
- Create: `src/components/home/upcoming-news.tsx`
- Create: `src/components/home/visit-panel.tsx`
- Create: `src/app/__tests__/home-page.test.tsx`

**Interfaces:**
- Consumes: `publicContentRepository.getNews()` and `.getDocuments("planning")`.
- Produces: server-rendered home page with direct planning, telephone, address and joining links.

- [ ] **Step 1: Write the failing home page test**

```tsx
// src/app/__tests__/home-page.test.tsx
import { render, screen } from "@testing-library/react";
import HomePage from "../page";

test("puts practical information and the current planning on the home page", async () => {
  render(await HomePage());
  expect(screen.getByRole("heading", { level: 1, name: /janus34/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /voir le planning/i })).toHaveAttribute("href", expect.stringContaining("/documents/"));
  expect(screen.getByRole("link", { name: /04 67 04 87 68/ })).toHaveAttribute("href", "tel:+33467048768");
  expect(screen.getByText(/405 rue des grèzes/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /nous rejoindre/i })).toHaveAttribute("href", "/nous-rejoindre");
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- src/app/__tests__/home-page.test.tsx`

Expected: FAIL because the home page does not expose the required information.

- [ ] **Step 3: Implement the home composition and responsive styles**

Use an unframed hero with the Janus34 name, one clear sentence and two actions. Follow it with a planning band, three upcoming items, a concise association introduction and a practical visit band. Cards are reserved for repeated news items; sections are full-width bands.

- [ ] **Step 4: Verify the home page**

Run: `npm test -- src/app/__tests__/home-page.test.tsx && npm run typecheck && npm run lint`

Expected: home page test passes and static checks exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/app src/components/home
git commit -m "feat: build practical Janus34 home page"
```

### Task 4: Core Information Pages

**Files:**
- Create: `src/components/content/content-page.tsx`
- Create: `src/components/content/document-list.tsx`
- Create: `src/app/qui-sommes-nous/page.tsx`
- Create: `src/app/activites/page.tsx`
- Create: `src/app/nous-rejoindre/page.tsx`
- Create: `src/app/ressources/page.tsx`
- Create: `src/app/mentions-legales/page.tsx`
- Create: `src/app/confidentialite/page.tsx`
- Create: `src/components/content/__tests__/content-page.test.tsx`

**Interfaces:**
- Consumes: `PublicPage`, `PublicDocument[]`.
- Produces: `ContentPage({ page, documents? })` shared semantic renderer.

- [ ] **Step 1: Write the failing content renderer test**

```tsx
// src/components/content/__tests__/content-page.test.tsx
import { render, screen } from "@testing-library/react";
import { ContentPage } from "../content-page";

test("renders structured sections and document downloads", () => {
  render(
    <ContentPage
      page={{
        slug: "exemple",
        title: "Titre",
        introduction: "Introduction",
        sections: [{ id: "section", title: "Section", body: "Contenu" }],
      }}
      documents={[{
        id: "doc-1",
        title: "Statuts",
        slug: "statuts",
        description: "Statuts de l'association",
        category: "institutional",
        mimeType: "application/pdf",
        updatedAt: "2026-10-11",
        downloadUrl: "/documents/statuts",
      }]}
    />,
  );
  expect(screen.getByRole("heading", { level: 1, name: "Titre" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 2, name: "Section" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /télécharger statuts/i })).toHaveAttribute("href", "/documents/statuts");
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- src/components/content/__tests__/content-page.test.tsx`

Expected: FAIL because `ContentPage` does not exist.

- [ ] **Step 3: Implement the renderer and routes**

Each route requests its exact slug from the repository and calls `notFound()` when absent. `ressources` includes health documents and a visible statement that Janus34 is not a healthcare provider. `nous-rejoindre` includes telephone, address, public transport and first-visit process. Legal pages contain only reviewed placeholders clearly labelled for association validation before production.

- [ ] **Step 4: Verify core pages**

Run: `npm test -- src/components/content/__tests__/content-page.test.tsx && npm run typecheck && npm run lint`

Expected: renderer test passes and static checks exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/app/qui-sommes-nous src/app/activites src/app/nous-rejoindre src/app/ressources src/app/mentions-legales src/app/confidentialite src/components/content
git commit -m "feat: add core public information pages"
```

### Task 5: Planning and News Experience

**Files:**
- Create: `src/app/actualites/page.tsx`
- Create: `src/components/news/news-list.tsx`
- Create: `src/components/news/news-item.tsx`
- Create: `src/components/news/__tests__/news-list.test.tsx`

**Interfaces:**
- Consumes: `NewsItem[]`, planning documents.
- Produces: `NewsList({ items, now })` separating upcoming and archived information deterministically.

- [ ] **Step 1: Write the failing date-grouping test**

```tsx
// src/components/news/__tests__/news-list.test.tsx
import { render, screen, within } from "@testing-library/react";
import { NewsList } from "../news-list";

test("separates upcoming and archived announcements", () => {
  render(<NewsList now="2026-10-11T12:00:00+02:00" items={[
    { id: "future", title: "Atelier", excerpt: "Création", startsAt: "2026-10-15T14:00:00+02:00", endsAt: null, featured: true, status: "published" },
    { id: "past", title: "Assemblée", excerpt: "Compte rendu", startsAt: "2026-09-01T14:00:00+02:00", endsAt: null, featured: false, status: "published" },
  ]} />);
  expect(within(screen.getByRole("region", { name: /à venir/i })).getByText("Atelier")).toBeInTheDocument();
  expect(within(screen.getByRole("region", { name: /archives/i })).getByText("Assemblée")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- src/components/news/__tests__/news-list.test.tsx`

Expected: FAIL because `NewsList` does not exist.

- [ ] **Step 3: Implement deterministic news grouping**

Parse timestamps once, compare against the explicit `now` prop and render localized dates with `Intl.DateTimeFormat("fr-FR")`. Keep archives collapsed behind a native `<details>` element and put the current planning above the list.

- [ ] **Step 4: Verify news behavior**

Run: `npm test -- src/components/news/__tests__/news-list.test.tsx && npm run typecheck`

Expected: grouping test passes and typecheck exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/app/actualites src/components/news
git commit -m "feat: add planning and news timeline"
```

### Task 6: Contact Page Shell and Validation Boundary

**Files:**
- Create: `src/app/contact/page.tsx`
- Create: `src/components/contact/contact-form.tsx`
- Create: `src/lib/contact/contact-schema.ts`
- Create: `src/lib/contact/__tests__/contact-schema.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `contactSchema` and `ContactInput` for the later server action.
- Produces: progressively enhanced contact form with honeypot field and consent checkbox.

- [ ] **Step 1: Install validation dependency**

Run: `npm install zod`

- [ ] **Step 2: Write failing validation tests**

```ts
// src/lib/contact/__tests__/contact-schema.test.ts
import { contactSchema } from "../contact-schema";

test("accepts a complete contact request", () => {
  expect(contactSchema.safeParse({
    name: "Camille",
    email: "camille@example.fr",
    subject: "Première visite",
    message: "Bonjour, je souhaiterais convenir d'un rendez-vous.",
    consent: true,
    company: "",
  }).success).toBe(true);
});

test("rejects spam honeypot and missing consent", () => {
  expect(contactSchema.safeParse({
    name: "Robot",
    email: "robot@example.fr",
    subject: "Message",
    message: "Message suffisamment long",
    consent: false,
    company: "filled",
  }).success).toBe(false);
});
```

- [ ] **Step 3: Run tests and verify RED**

Run: `npm test -- src/lib/contact/__tests__/contact-schema.test.ts`

Expected: FAIL because `contactSchema` does not exist.

- [ ] **Step 4: Implement schema and non-sending form**

```ts
// src/lib/contact/contact-schema.ts
import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().min(3).max(150),
  message: z.string().trim().min(20).max(5000),
  consent: z.literal(true),
  company: z.literal(""),
});

export type ContactInput = z.infer<typeof contactSchema>;
```

The form labels every input, explains required consent, uses a hidden-but-focus-safe honeypot, and states that message sending becomes active after secure backend configuration. It must not pretend to submit successfully in this phase.

- [ ] **Step 5: Verify contact boundary**

Run: `npm test -- src/lib/contact/__tests__/contact-schema.test.ts && npm run typecheck && npm run lint`

Expected: two validation tests pass and static checks exit 0.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/app/contact src/components/contact src/lib/contact
git commit -m "feat: add validated contact experience"
```

### Task 7: Legacy Redirects, SEO and Responsive E2E Coverage

**Files:**
- Modify: `next.config.ts`
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`
- Create: `tests/public-site.spec.ts`

**Interfaces:**
- Produces: permanent redirect map for priority WordPress paths.
- Produces: desktop and 320 px public smoke tests.

- [ ] **Step 1: Write the failing E2E tests**

```ts
// tests/public-site.spec.ts
import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 320, height: 720 }, { width: 1440, height: 900 }]) {
  test(`home remains usable at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: /janus34/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /voir le planning/i })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });
}

test("legacy join URL redirects to the new page", async ({ page }) => {
  await page.goto("/nous-contacter/devenir-adherent/");
  await expect(page).toHaveURL(/\/nous-rejoindre$/);
});
```

- [ ] **Step 2: Start the test server and verify RED**

Run: `npx playwright install chromium && npm run build && npm run test:e2e`

Expected: redirect test fails before the redirect map is added.

- [ ] **Step 3: Add redirects and metadata routes**

Add permanent redirects for `/nous-contacter/`, `/nous-contacter/devenir-adherent/`, `/nos-objectifs-2/`, `/nos-objectifs-2/les-activites/`, `/le-trouble-bipolaire-2/`, `/le-trouble-bipolaire-2/video-conferences/`, `/le-trouble-bipolaire-2/sites-internet/`, `/evenements/`, `/actualites-2__trashed/samedi/` and `/actualites-2__trashed/conferences/`. Add sitemap entries for every public route and disallow `/admin` in robots metadata.

- [ ] **Step 4: Run the full verification suite**

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

Expected: every command exits 0 and both viewport cases report no horizontal overflow.

- [ ] **Step 5: Commit**

```bash
git add next.config.ts src/app/sitemap.ts src/app/robots.ts tests/public-site.spec.ts
git commit -m "test: verify public routes and responsive layout"
```

## Plan Self-Review

- Spec coverage: public information architecture, planning, documents, contact boundary, accessibility, responsive behavior and legacy redirects are covered.
- Deliberately deferred: Supabase schema, authentication, administration, rich editing, file versioning, e-mail sending, automated backup and production deployment belong to the next independently testable plan.
- Placeholder scan: legal copy is explicitly treated as content requiring association approval, not as an implementation placeholder; the contact form explicitly remains non-sending until its secure backend task.
- Type consistency: repository methods and shared types are defined in Task 2 and consumed unchanged by Tasks 3-5.

