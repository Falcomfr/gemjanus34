# Gem Janus34 Public Site Final-Fix Report

Date: 2026-10-11

Base SHA: `3d7bd398897f1d123315dd80b51288a642dc939d`

Result commit: the commit containing this report, with subject `fix: harden public site for production`. The resolved final SHA is reported in the task handoff because a Git commit cannot contain its own hash without changing that hash.

## Outcome

All eight final-review findings were addressed. The public site now shares explicit Europe/Paris date handling, preserves date-only announcements through the end of their Paris calendar day, runs Playwright against a freshly built production server, covers every public route and redirect, emits baseline security headers, and closes the requested accessibility and navigation-maintenance gaps.

## RED Evidence

Baseline at `3d7bd39`:

- `npm test`: 9 files and 29 tests passed before changes.

Focused RED run after adding tests and before production changes:

- `src/lib/date/__tests__/public-date.test.ts` failed because `public-date.ts` did not exist.
- `src/components/contact/__tests__/contact-form.test.tsx` failed because the textarea had no `minlength`, `maxlength`, or associated accessible description.
- `src/components/__tests__/site-header.test.tsx` failed because the disclosure accessible name was `Ouvrir la navigation`, not neutral `Menu`.
- The first date-boundary fixture was corrected during RED because it did not reproduce the defect. With `now="2026-10-12T20:00:00Z"`, `src/components/news/__tests__/news-list.test.tsx` failed because the date-only `2026-10-12` item was incorrectly placed in archives at 22:00 Europe/Paris.
- `npm run test:e2e` ran 24 new acceptance cases against the pre-change development server: 22 passed and the security-header case failed because `Content-Security-Policy` was absent. One route expectation was corrected from `Nos activités` to the actual reviewed H1 `Activités`; this was a test-fixture error, not a product failure.

The strengthened exact desktop/mobile navigation test passed during RED because the rendered labels and links were already correct. It replaced the weaker `arrayContaining` assertion and now protects exact order and hrefs while the production refactor removes the duplicate data source.

## GREEN Evidence

- Focused tests: 4 files, 11 tests passed.
- Full unit/component suite: 10 files, 37 tests passed.
- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0.
- `npm run build`: exit 0; 13 static routes generated.
- `npm audit --omit=dev`: 0 vulnerabilities.
- `npm run test:e2e`: rebuilt with `next build`, served with `next start`, and passed all 24 Chromium tests.
- `git diff --check`: no whitespace errors.

Production E2E coverage now verifies:

- All nine public routes at 320 px have a visible H1 and no horizontal overflow.
- The desktop home scenario remains covered at 1440 px.
- The mobile disclosure opens and exposes its links.
- All ten legacy mappings return HTTP 308 with the exact destination `Location`.
- `sitemap.xml` contains exactly all nine public URLs.
- `robots.txt` allows public crawling, disallows `/admin`, and names the sitemap.
- Every public page response carries CSP, Referrer-Policy, X-Content-Type-Options, and Permissions-Policy assertions.

## Implementation

Date behavior:

- `src/lib/date/public-date.ts` is the single date boundary. Date-only values are validated and formatted as calendar dates; full ISO values are parsed and formatted as instants in `Europe/Paris`.
- Date-only archive comparisons use the current Europe/Paris `YYYY-MM-DD`, so an undated event remains current for its entire local day. Full timestamps retain millisecond instant comparison.
- `src/components/home/upcoming-news.tsx`, `src/components/news/news-item.tsx`, and `src/components/news/news-list.tsx` consume the shared utility.
- `src/lib/date/__tests__/public-date.test.ts` and `src/components/news/__tests__/news-list.test.tsx` cover both value shapes and the Paris day boundary.

Production and E2E behavior:

- `package.json` makes `test:e2e` run `npm run build` before Playwright.
- `playwright.config.ts` starts `npm run start` and refuses to reuse an unrelated server.
- `tests/public-site.spec.ts` contains the complete public-route, menu, redirect, metadata, and header matrix.

Security headers:

- `next.config.ts` applies headers to `/:path*`, covering pages and metadata routes.
- CSP defaults all loading to same-origin, forbids plugins through `object-src 'none'`, prevents embedding with `frame-ancestors 'none'`, limits forms and base URLs to self, and narrows images, fonts, scripts, styles, and connections to what the current static Next application uses.
- Production allows inline script/style because Next emits inline bootstrap and style content for this deployment model. It does not allow `unsafe-eval`; that allowance and websocket/HTTP development connections are added only when `NODE_ENV=development` so local HMR remains practical.
- `X-Frame-Options: DENY` reinforces the CSP framing rule for older clients.
- `Referrer-Policy: strict-origin-when-cross-origin` limits cross-origin path leakage.
- `X-Content-Type-Options: nosniff` prevents MIME sniffing.
- Permissions Policy disables camera, geolocation, microphone, payment, and USB capabilities that the public site does not need.

Accessibility and maintenance:

- `src/components/contact/contact-form.tsx` mirrors the schema's 20/5000 message limits and connects the hint with `aria-describedby`; its focused test verifies all three attributes.
- `src/components/site-header.tsx` now reads `publicNavigation` from `src/content/navigation.ts` and exposes the neutral disclosure name `Menu`.
- `src/components/__tests__/site-header.test.tsx` asserts exact ordered label/href pairs independently for desktop and mobile navigation, without partial-array matching.

## Files Changed

- `.superpowers/sdd/final-fix-report.md`
- `next.config.ts`
- `package.json`
- `playwright.config.ts`
- `src/components/__tests__/site-header.test.tsx`
- `src/components/contact/__tests__/contact-form.test.tsx`
- `src/components/contact/contact-form.tsx`
- `src/components/home/upcoming-news.tsx`
- `src/components/news/__tests__/news-list.test.tsx`
- `src/components/news/news-item.tsx`
- `src/components/news/news-list.tsx`
- `src/components/site-header.tsx`
- `src/lib/date/__tests__/public-date.test.ts`
- `src/lib/date/public-date.ts`
- `tests/public-site.spec.ts`

## Concerns

- The production dependency audit is clean. A full development audit still reports five high-severity findings in the ESLint-only chain (`braces` via `micromatch`, `fast-glob`, `@next/eslint-plugin-next`, and `eslint-config-next`). npm offers only a forced breaking downgrade to `eslint-config-next@14.2.35`; that was not applied because it conflicts with the Next 16 toolchain and is outside deployable dependencies.
- The CSP intentionally includes production `unsafe-inline` for scripts and styles because the current Next output requires inline bootstrap/style content. A future nonce- or hash-based CSP can tighten this when the deployment architecture provides request-scoped nonces or stable generated hashes.
- Existing milestone deferrals remain unchanged: legal copy still requires association validation, and contact delivery remains disabled until its secure backend is implemented.

## Second Final-Fix

Date: 2026-10-11

Base SHA: `79acae68bb0d4a16fcea532866f90aae2842b0d5`.

Result SHA: the commit containing this section, with subject `fix: validate and order public dates strictly`. Its resolved SHA is reported in the task handoff because embedding a commit's own SHA would change that SHA.

### Outcome

- Public dates now accept only valid `YYYY-MM-DD` calendar dates or full `YYYY-MM-DDTHH:mm:ss[.fraction](Z|+HH:mm|-HH:mm)` timestamps. Calendar, clock and offset fields are validated before `Date` parsing.
- `publicDateTimestamp` is the shared chronological key used by both `NewsList` and the local public content repository. Offset-equivalent instants retain stable input order and differing offsets sort by instant.
- Production E2E coverage checks every configured security header, `X-Frame-Options`, all five Permissions Policy restrictions, and includes `sitemap.xml` and `robots.txt`.
- Europe/Paris date-only end-of-day behavior remains unchanged.

### RED Evidence

- Focused command: `npm test -- src/lib/date/__tests__/public-date.test.ts src/components/news/__tests__/news-list.test.tsx src/lib/content/__tests__/local-public-content-repository-ordering.test.ts`.
- Result: exit 1; 2 files failed, 1 passed; 7 tests failed and 16 passed.
- Four invalid inputs were still accepted (`2026-02-30T12:00:00Z`, `2026-10-15T24:00:00Z`, `2026-10-15T12:00:00`, and `October 15, 2026`), two tests failed because `publicDateTimestamp` did not exist, and repository ordering was lexical rather than chronological.
- The new `NewsList` ordering assertion passed during RED because its existing `Date.parse` sorting already handled the fixture; the production change removes that duplicate conversion in favor of the shared key.
- Focused production E2E command: `npm run build && npx playwright test -g "all public responses include every configured security header"`.
- Result: exit 1 during typecheck because the test-first `publicDateTimestamp` import had no production export yet.

### GREEN Evidence

- Focused tests: 4 files and 30 tests passed.
- Full unit/component suite: 11 files and 54 tests passed.
- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0.
- `npm run build`: exit 0; 13 static routes generated.
- `npm run test:e2e`: rebuilt the production application and passed all 24 Chromium tests.
- `npm audit --omit=dev`: 0 vulnerabilities.
- `git diff --check`: exit 0 after the report update.

### Files Changed

- `.superpowers/sdd/final-fix-report.md`
- `src/components/news/__tests__/news-list.test.tsx`
- `src/components/news/news-list.tsx`
- `src/lib/content/__tests__/local-public-content-repository-ordering.test.ts`
- `src/lib/content/local-public-content-repository.ts`
- `src/lib/date/__tests__/public-date.test.ts`
- `src/lib/date/public-date.ts`
- `tests/public-site.spec.ts`

### Concerns

- No new product concerns. The existing CSP, development-audit, legal-copy and contact-delivery concerns above remain unchanged.
- The external reviewer subprocess was unavailable because the installed Codex launcher lacks its Linux optional package; the final requirements and diff review was completed inline instead.

## Final Document Date Consistency Fix

Date: 2026-10-11

Base SHA: `fa291a49dec5687975d5ebe780590b5dfd78ba36`.

Implementation SHA: `5db64cab3afda9e926a5662612317e352effdde5` (`fix: apply strict dates to public documents`).

### Outcome

- `selectLatestDocument` now compares `updatedAt` values by `publicDateTimestamp`, so differing offsets are ordered by instant and equal instants retain the ascending document-ID tie-break.
- The local content repository invokes the strict shared public-date boundary before cloning every document returned by `getDocuments()` or `getSiteData()`.
- The remaining reverse lexical repository test oracle now asserts descending numeric chronological keys.
- Focused tests cover differing-offset document selection, equal-instant deterministic selection, and malformed, impossible, arbitrary, and timezone-less document-date rejection through both repository return paths.

### RED Evidence

- Selector command: `npm test -- src/lib/content/__tests__/select-latest-document.test.ts`.
- Result: exit 1; 1 file failed and both tests failed. The lexical implementation selected `2026-10-15T10:00:00+02:00` over the later `2026-10-15T09:00:00Z` instant and also bypassed the ID tie-break for the offset-equivalent `2026-10-15T08:00:00Z` value.
- Repository command: `npm test -- src/lib/content/__tests__/local-public-content-repository-documents.test.ts src/lib/content/__tests__/local-public-content-repository.test.ts`.
- Result: exit 1; the existing repository suite passed, while all 4 document-boundary cases failed because `getDocuments()` resolved with invalid data instead of rejecting.
- The first post-implementation repository run passed the malformed case but left 3 failures because the test mock had snapshotted the first table value. Changing the mock's `updatedAt` to a getter corrected the fixture; no production change was needed for that test issue.

### GREEN Evidence

- Selector test: 1 file and 2 tests passed.
- Repository boundary and oracle tests: 2 files and 11 tests passed.
- Focused date/content command: `npm test -- src/lib/date/__tests__/public-date.test.ts src/lib/content/__tests__/select-latest-document.test.ts src/lib/content/__tests__/local-public-content-repository.test.ts src/lib/content/__tests__/local-public-content-repository-documents.test.ts src/lib/content/__tests__/local-public-content-repository-ordering.test.ts`.
- Focused result: exit 0; 5 files and 33 tests passed.
- Full unit/component suite: `npm test` exited 0; 13 files and 60 tests passed.
- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0.
- `npm run build`: exit 0; 13 static routes generated.
- `npm run test:e2e`: exit 0 after a fresh production build; all 24 Chromium tests passed against `next start`.
- `npm audit --omit=dev`: exit 0; 0 vulnerabilities.
- `git diff --check`: exit 0.
- A requirements scan found no remaining lexical `updatedAt` comparison or `.sort().reverse()` oracle in `src/lib/content`.

### Review

- Inline requirements and cached-diff review found no Critical or Important issues.
- A separate reviewer subprocess could not run because the installed Codex launcher still lacks `@openai/codex-linux-x64`; `codex --version` exited 1 with that dependency error.

### Files Changed

- `src/lib/content/__tests__/local-public-content-repository-documents.test.ts`
- `src/lib/content/__tests__/local-public-content-repository.test.ts`
- `src/lib/content/__tests__/select-latest-document.test.ts`
- `src/lib/content/local-public-content-repository.ts`
- `src/lib/content/select-latest-document.ts`
- `.superpowers/sdd/final-fix-report.md` (evidence follow-up)

### Concerns

- No new product concerns. The existing CSP, development-audit, legal-copy and contact-delivery concerns remain unchanged.
- The report is committed separately from the implementation because a commit cannot contain its own immutable SHA.
