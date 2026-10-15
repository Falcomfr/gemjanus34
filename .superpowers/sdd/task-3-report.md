# Admin Task 3 Report

## Status

`DONE_WITH_CONCERNS`

The page administration, controlled Tiptap editor, lifecycle server actions, responsive UI, and focused tests are implemented. The existing database does not permit session-bound reads of `page_revisions`, so revision restoration is implemented and callable with a known revision UUID, but the admin revision list cannot receive rows until a database read policy/grant is added.

## Files

Created:

- `src/lib/content/rich-content-schema.ts`
- `src/lib/content/__tests__/rich-content-schema.test.ts`
- `src/lib/admin/page-input.ts`
- `src/lib/admin/__tests__/page-input.test.ts`
- `src/app/admin/pages/page.tsx`
- `src/app/admin/pages/nouveau/page.tsx`
- `src/app/admin/pages/[id]/page.tsx`
- `src/app/admin/pages/actions.ts`
- `src/components/admin/page-form.tsx`
- `src/components/admin/rich-text-editor.tsx`
- `src/components/admin/editor-toolbar.tsx`
- `src/components/admin/__tests__/rich-text-editor.test.ts`

Modified:

- `package.json`
- `package-lock.json`
- `src/app/globals.css`

## Implementation

- Added the exact Tiptap 3.31.4 dependencies from the brief.
- Added a strict recursive Zod grammar for the approved nodes, marks, link protocols, heading levels, and four exact colors.
- Added editor serialization that removes Tiptap 3.31's incompatible ordered-list `type: null` attribute and validates the resulting document before submission.
- Disabled StarterKit content features outside the approved schema: blockquote, code, code block, horizontal rule, and strike.
- Added page form parsing with French field errors and pure update authorization logic. Editor updates preserve slug, structure, and lifecycle fields; all updates preserve lifecycle status outside dedicated actions.
- Added create/update/publish/archive/restore server actions. Every action authenticates with `requireProfile`, validates its `FormData`, uses the session-bound Supabase client, returns typed French errors, and revalidates `/`, the public slug, and `/admin/pages` after success.
- Added page list, create, and edit screens with role-aware fields, publication controls, revision UI, status indicators, and responsive table/editor layouts.
- Added a controlled toolbar for undo, redo, paragraph/H2/H3, bold, italic, underline, link, bullet/ordered lists, and four labelled color swatches.

## TDD Evidence

Initial validator RED:

```text
npm test -- src/lib/content/__tests__/rich-content-schema.test.ts src/lib/admin/__tests__/page-input.test.ts
exit 1: both suites failed because rich-content-schema and page-input did not exist
```

Validator GREEN:

```text
2 test files passed, 20 tests passed
```

Parsing/authorization RED:

```text
npm test -- src/lib/admin/__tests__/page-input.test.ts
exit 1: 4 expected failures because parsePageFormData and buildPageUpdate did not exist
```

Parsing/authorization GREEN:

```text
1 test file passed, 13 tests passed
```

Ordered-list compatibility RED/GREEN:

```text
RED: serializeRichContent was not a function
GREEN: 1 test file passed, 12 tests passed
```

Controlled extension set RED/GREEN:

```text
RED: createRichTextExtensions was not a function
GREEN: focused editor/schema/input run passed 3 files and 26 tests
```

Optional structure fields RED/GREEN:

```text
RED: navigationPosition and parentId rejected undefined
GREEN: page-input test passed 14 tests
```

Final focused result:

```text
3 test files passed, 27 tests passed
```

## Verification

```text
npm test
19 test files passed, 94 tests passed

npm run typecheck
exit 0

npm run lint
exit 0, no warnings

npm run build
exit 0; optimized Next.js build compiled and generated all 17 routes

git diff --check
exit 0

npm audit --omit=dev
found 0 vulnerabilities
```

Browser verification used Playwright with the local Chromium and local Supabase stack:

- Authenticated as the seeded local administrator.
- Loaded `/admin/pages/nouveau` at 1440 x 1000 and 320 x 800.
- Confirmed no document or element horizontal overflow at either viewport.
- Confirmed the editor rendered all 12 toolbar buttons with no Next.js error UI.
- Captured and inspected `/tmp/gemjanus34-admin-desktop.png` and `/tmp/gemjanus34-admin-mobile.png`; controls and text did not overlap.
- Created an ordered list in the real editor and confirmed hidden JSON contained `attrs: { start: 1 }` with no legacy `type` key.

## Self-Review

- Re-read the brief and Global Constraints requirement by requirement.
- Confirmed no service-role client or trusted HTML was introduced.
- Confirmed direct form tampering cannot change lifecycle status, and editor updates cannot change slug/navigation/parent.
- Confirmed published pages are read-only in the form until an administrator archives them, matching the existing trigger rules.
- Confirmed lifecycle actions use `publish_page(uuid)` and `restore_page_revision(uuid)` RPCs, while archive is a session-bound `pages` update.
- Confirmed admin `noindex` metadata remains inherited from the existing protected layout.
- Confirmed no unrelated tracked files were changed.

## Concerns

1. `page_revisions` has RLS enabled but the existing migration defines no SELECT policy and grants no table SELECT privilege to authenticated users. The session-bound query in the edit page therefore returns no revision rows. A separately authorized database migration is needed before the revision history/restoration control can be populated.
2. Full `npm audit` reports five high-severity development-only vulnerabilities through `eslint-config-next -> fast-glob -> micromatch -> braces`. Production dependency audit is clean. The suggested forced fix downgrades `eslint-config-next` to 14.2.35 and is not appropriate for this Next.js 16 task.

## Controller Follow-up

- Added a failing pgTAP contract for administrator-only revision reads (2 expected failures), then added migration `20261015234500_page_revision_admin_read.sql`.
- After a full local database reset, all 93 pgTAP assertions pass and `supabase db lint --level warning` reports no schema errors.
- Revision history is now readable by active administrators only; editor and anonymous access remain denied.

## Fix Follow-up

### Status

`DONE`

All Critical and Important review findings were fixed from base commit `f22153a` without push or deployment.

### Changed Files

- `.superpowers/sdd/task-3-report.md`
- `src/app/admin/pages/[id]/page.tsx`
- `src/app/admin/pages/[id]/__tests__/page.test.tsx`
- `src/app/admin/pages/actions.ts`
- `src/app/admin/pages/nouveau/page.tsx`
- `src/components/admin/page-form.tsx`
- `src/components/admin/rich-text-editor.tsx`
- `src/components/admin/__tests__/page-form.test.tsx`
- `src/components/admin/__tests__/rich-text-editor.test.ts`
- `src/lib/admin/page-lifecycle-actions.ts`
- `src/lib/admin/__tests__/page-lifecycle-actions.test.ts`
- `src/lib/content/rich-content-schema.ts`

### Fixes

- Added Tiptap Link's nullable `title` attribute to the strict rich-content allowlist. A real `Editor` regression proves the configured extension emits `title: null` and the controlled serializer accepts that PostgreSQL JSON-safe shape.
- Preserved edit-page query errors instead of collapsing them into empty arrays. Revision failures render an explicit error, parent-option failures remove the save action and disable structural controls, and the selected parent remains available when archived.
- Added a stable accessible name to the ProseMirror textbox. Form and lifecycle feedback now uses alert/status live regions, and validation errors are connected to controls with `aria-invalid`, `aria-describedby`, and stable label IDs.
- Extracted request-scoped lifecycle orchestration behind injected dependencies. Tests prove editor publication stops before page access or mutation, failed publication returns the French form error, and successful publish/archive/restore actions revalidate `/`, the public slug, and `/admin/pages`.

### RED Evidence

1. `npm test -- src/components/admin/__tests__/rich-text-editor.test.ts`
   - Exit 1: 1 of 2 tests failed. The real configured Tiptap editor emitted `title: null`; `serializeRichContent` threw a Zod `unrecognized_keys` error for `title`.
2. `npm test -- 'src/app/admin/pages/[id]/__tests__/page.test.tsx' src/components/admin/__tests__/page-form.test.tsx`
   - Exit 1: 4 of 4 tests failed. Query errors were passed as empty arrays, the archived selected parent was filtered out, no query error alerts rendered, and save/parent controls remained enabled.
3. `npm test -- src/components/admin/__tests__/rich-text-editor.test.ts src/components/admin/__tests__/page-form.test.tsx`
   - Exit 1: the first accessibility run exposed a `.ts`/JSX parse error in the new editor test and the form test failed because `aria-live="assertive"` was absent. The harness was corrected to use `createElement`; this run was not counted as behavioral RED for the editor.
4. `npm test -- src/components/admin/__tests__/rich-text-editor.test.ts src/components/admin/__tests__/page-form.test.tsx`
   - Exit 1: 2 focused behavioral failures. ProseMirror had `role="textbox"` but no accessible name or error attributes, and async form feedback still lacked `aria-live`.
5. `npm test -- src/lib/admin/__tests__/page-lifecycle-actions.test.ts`
   - Exit 1: the lifecycle dependency seam did not exist, so the test suite could not resolve `page-lifecycle-actions`.

### GREEN Evidence

1. `npm test -- src/components/admin/__tests__/rich-text-editor.test.ts src/lib/content/__tests__/rich-content-schema.test.ts`
   - Exit 0: 2 files passed, 14 tests passed.
2. `npm test -- 'src/app/admin/pages/[id]/__tests__/page.test.tsx' src/components/admin/__tests__/page-form.test.tsx`
   - Exit 0: 2 files passed, 4 tests passed.
3. First accessibility implementation rerun:
   - Exit 1: editor accessibility passed, but 1 form test revealed that nested error text changed the computed label from `Titre`. Explicit stable label IDs were then added.
4. `npm test -- src/components/admin/__tests__/rich-text-editor.test.ts src/components/admin/__tests__/page-form.test.tsx`
   - Exit 0: 2 files passed, 6 tests passed.
5. `npm test -- src/lib/admin/__tests__/page-lifecycle-actions.test.ts`
   - Exit 0: 1 file passed, 5 tests passed.
6. Focused regression command covering schema, editor, form, edit route, lifecycle, and page input:
   - Exit 0: 6 files passed, 39 tests passed.
7. The paired focused/typecheck run initially had focused tests green but typecheck exit 2 because two mocks were inferred too narrowly (`admin` only and `error: null` only). The fixtures were widened to the production contracts.
8. `npm test -- src/lib/admin/__tests__/page-lifecycle-actions.test.ts`
   - Exit 0: 1 file passed, 5 tests passed after fixture correction.
9. `npm run typecheck`
   - Exit 0 after fixture correction.

### Full Verification

- `npm test`: exit 0; 22 test files passed, 106 tests passed.
- `npm run typecheck`: exit 0; `tsc --noEmit` completed without diagnostics.
- `npm run lint`: exit 0; ESLint completed without warnings or errors.
- `npm run build`: exit 0; Next.js 16.4.0 compiled successfully, TypeScript completed, and all 17 routes were generated.
- `git diff --check`: exit 0.

### Self-Review

- Re-read every review finding against the final diff and tests.
- Confirmed Link attributes remain strict: only `href`, `target`, `rel`, `class`, and `title` are accepted, and existing unsafe-link checks remain intact.
- Confirmed parent loading distinguishes an empty successful result from a failed result, the current archived parent survives filtering, and administrators cannot submit while parent options are unavailable. Editors retain server-preserved structure fields.
- Confirmed revision query failures no longer display the false `Aucune révision publiée.` state.
- Confirmed all form validation messages have stable described-by targets and do not alter the controls' accessible names.
- Confirmed lifecycle dependencies are created per server-action invocation; the Supabase mutation client is lazy and is not initialized for denied editors.
- Confirmed successful lifecycle operations revalidate only after a successful mutation and mutation failures do not revalidate.
- Confirmed no unrelated tracked work was modified and no push or deployment was performed.

### Concerns

None introduced by this follow-up. The original report's development-only audit concern remains outside this review scope.
