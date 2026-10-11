# Gem Janus34 Supabase Admin Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a secure Supabase-backed administration area where four to five named users can authenticate, manage pages and news, publish revisions, and serve published content to the existing public site.

**Architecture:** PostgreSQL and Row Level Security are the authorization source of truth. Next.js Server Components read published content with an anonymous Supabase client, while authenticated server actions use the signed-in user's session and remain subject to RLS. The public UI keeps its existing repository interface, allowing local seed fallback when Supabase environment variables are absent.

**Tech Stack:** Next.js 16.4, React 19.3, TypeScript strict, Supabase PostgreSQL/Auth/SSR JS, Tiptap 3.31, Zod, Vitest, Playwright, pgTAP through Supabase CLI.

## Global Constraints

- Every editor has an individual Supabase Auth account; no shared password.
- Roles are exactly `admin` and `editor`.
- Authorization is enforced by PostgreSQL RLS and repeated at server-action boundaries.
- Anonymous users can read only published pages and news.
- Editors can create and update editorial content but cannot manage profiles or roles.
- Administrators can manage profiles, navigation structure, publication, archival and restoration.
- Rich content is stored as validated Tiptap JSON, never trusted HTML.
- Every publication or restoration creates an immutable page revision and audit event.
- The public site keeps working from local seed data when Supabase variables are absent.
- No service-role key is exposed to browser code.
- All admin pages are usable at 320 px and carry `noindex` metadata.

---

### Task 1: Local Supabase Schema, RLS and Database Tests

**Files:**
- Create: `supabase/config.toml`
- Create: `supabase/migrations/20261011220000_admin_core.sql`
- Create: `supabase/seed.sql`
- Create: `supabase/tests/admin_core_test.sql`
- Create: `src/lib/database.types.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces enums `public.app_role`, `public.content_status`.
- Produces tables `profiles`, `pages`, `page_revisions`, `news`, `audit_log`.
- Produces functions `current_app_role()`, `is_active_editor()`, `is_admin()`, `publish_page(uuid)`, `restore_page_revision(uuid)`.
- Produces generated `Database` TypeScript type.

- [ ] **Step 1: Initialize Supabase and write failing pgTAP authorization tests**

Run:

```bash
supabase init
supabase start
```

Create tests asserting:

```sql
begin;
select plan(12);
select has_table('public', 'profiles');
select has_table('public', 'pages');
select has_table('public', 'page_revisions');
select has_table('public', 'news');
select has_table('public', 'audit_log');
select policies_are('public', 'profiles', array['profiles_read_self', 'profiles_admin_all']);
select policies_are('public', 'pages', array['pages_public_read', 'pages_editor_write']);
select policies_are('public', 'news', array['news_public_read', 'news_editor_write']);
select function_returns('public', 'current_app_role', array[]::text[], 'app_role');
select function_returns('public', 'is_active_editor', array[]::text[], 'boolean');
select function_returns('public', 'is_admin', array[]::text[], 'boolean');
select col_is_unique('public', 'pages', 'slug');
select * from finish();
rollback;
```

- [ ] **Step 2: Verify RED**

Run: `supabase test db`

Expected: FAIL because the tables and functions do not exist.

- [ ] **Step 3: Implement the migration**

The migration must:

```sql
create extension if not exists pgcrypto;
create type public.app_role as enum ('admin', 'editor');
create type public.content_status as enum ('draft', 'published', 'archived');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 100),
  role public.app_role not null default 'editor',
  active boolean not null default true,
  notify_on_publish boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 160),
  summary text not null default '',
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  status public.content_status not null default 'draft',
  navigation_position integer,
  parent_id uuid references public.pages(id) on delete set null,
  created_by uuid not null references public.profiles(id),
  updated_by uuid not null references public.profiles(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.page_revisions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  title text not null,
  summary text not null,
  content jsonb not null,
  status public.content_status not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  excerpt text not null check (char_length(excerpt) between 1 and 500),
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  starts_at timestamptz not null,
  ends_at timestamptz,
  featured boolean not null default false,
  status public.content_status not null default 'draft',
  created_by uuid not null references public.profiles(id),
  updated_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

Add `security definer` role helpers with `set search_path = ''`, enable RLS on every table, and add exactly the policies named by the tests. `pages_public_read` and `news_public_read` permit `select` only when status is `published`. Editor write policies require `is_active_editor()`. Profile administration requires `is_admin()`; users may read their own active profile.

`publish_page(page_id)` locks the page, inserts a complete immutable revision, sets status and `published_at`, and appends `page.publish` to `audit_log`. `restore_page_revision(revision_id)` is admin-only, copies revision fields back into its page, creates a new revision describing the restored state, and logs `page.restore`.

- [ ] **Step 4: Add seed data and generate TypeScript types**

`seed.sql` inserts no auth user. It inserts public pages only through a documented local bootstrap user created with `supabase/seed.sql` in `auth.users`, followed by its admin profile, so local development can authenticate. Use `admin@gemjanus34.local` and password `local-development-only`; never use this credential in cloud environments.

Run:

```bash
supabase db reset
supabase test db
supabase gen types typescript --local > src/lib/database.types.ts
```

Expected: 12 pgTAP assertions pass and generated types contain all five tables.

- [ ] **Step 5: Commit**

```bash
git add .gitignore supabase src/lib/database.types.ts
git commit -m "feat: add Supabase admin schema and RLS"
```

### Task 2: Supabase Clients, Authentication and Admin Shell

**Files:**
- Create: `.env.example`
- Create: `src/lib/supabase/config.ts`
- Create: `src/lib/supabase/browser.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/proxy.ts`
- Create: `src/lib/auth/require-profile.ts`
- Create: `src/lib/auth/__tests__/require-profile.test.ts`
- Create: `src/proxy.ts`
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/connexion/page.tsx`
- Create: `src/app/admin/connexion/actions.ts`
- Create: `src/components/admin/admin-shell.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: `createBrowserClient()`, `createServerClient()`, `updateSession(request)`.
- Produces: `requireProfile(client?) -> Promise<Profile>` that redirects unauthenticated users and rejects inactive profiles.
- Produces: login/logout server actions and protected `/admin` shell.

- [ ] **Step 1: Install Supabase dependencies**

Run: `npm install @supabase/ssr@0.12.7 @supabase/supabase-js@2.117.3`

- [ ] **Step 2: Write failing authentication-boundary tests**

Tests cover unauthenticated redirect to `/admin/connexion`, inactive profile rejection, and active editor/admin profile return. Use a narrow injected client interface rather than mocking the Supabase package.

- [ ] **Step 3: Verify RED**

Run: `npm test -- src/lib/auth/__tests__/require-profile.test.ts`

Expected: FAIL because `requireProfile` does not exist.

- [ ] **Step 4: Implement environment and client boundaries**

`.env.example` contains only:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`config.ts` validates the two public values only when a Supabase client is requested. `server.ts` uses `cookies()` from `next/headers`; `browser.ts` is the only browser client module. The service-role variable is reserved for later server-only contact and backup work and must not be imported here.

- [ ] **Step 5: Implement auth and admin shell**

The login action validates email/password with Zod, calls `signInWithPassword`, returns a generic French error, and redirects to `/admin`. `requireProfile` calls `auth.getUser()`, reads the matching active profile, then returns `{ id, displayName, role, notifyOnPublish }`. The protected layout applies `robots: { index: false, follow: false }` and renders a compact sidebar with Dashboard, Pages, Actualités, Documents, Messages and Déconnexion.

- [ ] **Step 6: Verify and commit**

Run:

```bash
npm test -- src/lib/auth/__tests__/require-profile.test.ts
npm test
npm run typecheck
npm run lint
npm run build
```

Commit:

```bash
git add .env.example package.json package-lock.json src
git commit -m "feat: add protected Supabase admin shell"
```

### Task 3: Page Administration and Rich Editor

**Files:**
- Create: `src/lib/content/rich-content-schema.ts`
- Create: `src/lib/content/__tests__/rich-content-schema.test.ts`
- Create: `src/lib/admin/page-input.ts`
- Create: `src/lib/admin/__tests__/page-input.test.ts`
- Create: `src/app/admin/pages/page.tsx`
- Create: `src/app/admin/pages/nouveau/page.tsx`
- Create: `src/app/admin/pages/[id]/page.tsx`
- Create: `src/app/admin/pages/actions.ts`
- Create: `src/components/admin/page-form.tsx`
- Create: `src/components/admin/rich-text-editor.tsx`
- Create: `src/components/admin/editor-toolbar.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: `richContentSchema` allowing doc, paragraph, heading levels 2-3, bullet/ordered list, listItem, text, hardBreak, link, bold, italic, underline, textStyle/color.
- Produces: `pageInputSchema` with stable slug, title, summary, validated JSON content, status and optional navigation position.
- Produces server actions `createPage`, `updatePage`, `publishPage`, `archivePage`, `restorePageRevision`.

- [ ] **Step 1: Install editor dependencies**

Run:

```bash
npm install @tiptap/react@3.31.4 @tiptap/starter-kit@3.31.4 @tiptap/extension-link@3.31.4 @tiptap/extension-underline@3.31.4 @tiptap/extension-text-style@3.31.4 @tiptap/extension-color@3.31.4
```

- [ ] **Step 2: Write failing content and form tests**

Tests accept the listed node/mark set; reject script/iframe/image nodes, javascript links, unknown colors and heading level 1; require lowercase slugs and valid status.

- [ ] **Step 3: Verify RED and implement validators**

Run: `npm test -- src/lib/content/__tests__/rich-content-schema.test.ts src/lib/admin/__tests__/page-input.test.ts`

Expected: FAIL because modules do not exist. Then implement recursive discriminated Zod schemas and allow colors exactly `#202521`, `#185c4c`, `#c84f3b`, `#5b655f`.

- [ ] **Step 4: Implement Tiptap editor and toolbar**

The client editor serializes JSON into a hidden `content` input. Toolbar controls use Lucide icons and tooltips for undo, redo, bold, italic, underline, lists and link; color uses four labelled swatches; heading size uses a select with paragraph, heading 2 and heading 3. No arbitrary font size or HTML source mode.

- [ ] **Step 5: Implement server actions and pages**

Every action calls `requireProfile`, validates `FormData`, performs mutations through the session-bound server client, and returns a typed French field/form error. Only admins can change slug, navigation position, parent or archive published pages. Publishing and restoration call the database RPCs. All successful actions call `revalidatePath` for `/`, the public page and `/admin/pages`.

- [ ] **Step 6: Verify and commit**

Run all focused tests, full tests, typecheck, lint, build, then commit:

```bash
git add package.json package-lock.json src
git commit -m "feat: add page editor and revision workflow"
```

### Task 4: News Administration and Supabase Public Repository

**Files:**
- Create: `src/lib/admin/news-input.ts`
- Create: `src/lib/admin/__tests__/news-input.test.ts`
- Create: `src/app/admin/actualites/page.tsx`
- Create: `src/app/admin/actualites/nouvelle/page.tsx`
- Create: `src/app/admin/actualites/[id]/page.tsx`
- Create: `src/app/admin/actualites/actions.ts`
- Create: `src/components/admin/news-form.tsx`
- Create: `src/lib/content/supabase-public-content-repository.ts`
- Create: `src/lib/content/public-repository.ts`
- Create: `src/lib/content/__tests__/public-repository.test.ts`
- Modify: public route modules currently importing `local-public-content-repository.ts`

**Interfaces:**
- Produces: validated news CRUD actions.
- Produces: `getPublicContentRepository()` choosing Supabase only when both public environment variables exist, otherwise local seed.

- [ ] **Step 1: Write failing news and repository-selection tests**

Tests require title/excerpt, strict explicit-offset timestamps, `endsAt >= startsAt`, and valid content JSON. Repository selection returns local when either variable is absent and Supabase when both are present.

- [ ] **Step 2: Implement news admin**

Editors may create and update drafts and publish news. Admins may archive. Forms reuse `RichTextEditor`, use `datetime-local` inputs converted on the server from `Europe/Paris` to explicit ISO timestamps, and show status/date/author in the list.

- [ ] **Step 3: Implement Supabase public repository**

Map published `pages` and `news` rows to existing `PublicPage`/`NewsItem` types. Page JSON converts only supported paragraph and heading nodes to the current section model until the public renderer is upgraded; unsupported data fails closed with a logged server error and local fallback is used only when configuration is absent, never on query failure.

- [ ] **Step 4: Switch public imports and verify**

Public routes call `getPublicContentRepository()` once per request. Existing local tests remain valid with variables absent. Add repository mapping tests using an injected query client.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: add news admin and Supabase public content"
```

### Task 5: Cloud Project, Admin Bootstrap and Preview Verification

**Files:**
- Create: `docs/operations/admin-bootstrap.md`
- Create: `docs/operations/supabase-deployment.md`
- Modify: `.env.example` only if Supabase returns a different publishable-key naming convention.

**Interfaces:**
- Produces a dedicated cloud Supabase project in `eu-west-3` or the closest available French/European region.
- Produces Vercel environment variables for Preview and Production.
- Produces one named initial admin account without committing credentials.

- [ ] **Step 1: Create and link the cloud project**

Generate a 32-byte database password locally and store it only in `.env.local` under `SUPABASE_DB_PASSWORD`. Create `gemjanus34` in the authenticated organization, region `eu-west-3`, micro/free size as available. If the organization requires billing or has reached its project limit, stop before creating billable resources and report the exact blocker.

Run:

```bash
supabase projects create gemjanus34 --org-id lxpwrttnqymixudpwwhy --db-password "$SUPABASE_DB_PASSWORD" --region eu-west-3
supabase link --project-ref "$SUPABASE_PROJECT_REF"
supabase db push
```

- [ ] **Step 2: Configure local and Vercel environments**

Write returned public URL and publishable key to local `.env.local`. Add those two values to Vercel Preview and Production. Do not add a service-role key in this plan.

- [ ] **Step 3: Bootstrap the first admin**

Use Supabase Admin UI or an explicitly deleted one-time local script to invite the user's chosen e-mail. After the user exists, insert the profile row with role `admin`. Do not print or store the user's password.

- [ ] **Step 4: Deploy and verify**

Deploy a Vercel preview. Verify public fallback is no longer used, unauthenticated `/admin` redirects to login, the invited admin can log in, create a draft, publish it, observe a revision, and restore it. Run Playwright at 320 and 1440 px against the preview for public and admin critical paths.

- [ ] **Step 5: Document and commit**

Document migration, environment, invitation and rollback commands without secrets. Commit:

```bash
git add docs/operations .env.example
git commit -m "docs: add Supabase admin operations"
```

## Plan Self-Review

- Spec coverage: personal accounts, two roles, page/news editing, controlled rich text, navigation fields, publication, revisions, restoration, audit, RLS and public integration are covered.
- Deferred to the next independent plan: versioned document storage and `lien.gemjanus34.fr`, contact persistence/e-mail/rate limiting, backup automation and final domain cutover.
- Security: service-role access is explicitly excluded from browser/admin core code; cloud bootstrap credentials are never committed.
- Type consistency: public repository implementations preserve the interfaces introduced by the public-site plan.

