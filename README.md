# GEM Janus34

Site de [Janus34](https://gemjanus34.fr), Groupe d'Entraide Mutuelle à Montpellier : pages publiques (le GEM, activités, planning, première visite, ressources, galerie, lettre de la semaine, contact) et espace d'administration pour que l'équipe modifie le contenu elle-même.

En ligne : **https://gemjanus34.fr**

## Technique

- [Next.js](https://nextjs.org) 16 (App Router) et React 19, Tailwind CSS 4
- [Supabase](https://supabase.com) : base Postgres avec règles d'accès (RLS), authentification de l'équipe, stockage des documents et photos
- Éditeur de pages [Tiptap](https://tiptap.dev)
- Hébergement Vercel, déployé par une GitHub Action à chaque push sur `main` ([.github/workflows/deploy.yml](.github/workflows/deploy.yml))
- Gestionnaire de paquets : **npm** (ne pas utiliser pnpm ou yarn)

## Lancer en local

Prérequis : Node.js 20.9+, Docker et la [CLI Supabase](https://supabase.com/docs/guides/local-development).

```bash
npm ci
supabase start                  # base locale, migrations et données d'exemple
cp .env.example .env.local      # puis renseigner l'URL et les clés données par `supabase status`
npm run dev                     # http://localhost:3000
```

L'administration est sur `/admin`.

## Vérifier

```bash
npm run lint
npm run typecheck
npx vitest run       # tests unitaires
npm run test:e2e     # build puis tests Playwright
supabase test db     # tests SQL des règles d'accès
```

## Organisation

| Dossier | Contenu |
|---|---|
| `src/app` | pages publiques, `/admin`, routes API |
| `src/components` | composants du site et de l'administration |
| `src/lib` | accès Supabase, schémas de contenu, planning, statistiques |
| `supabase/migrations` | schéma de la base, à appliquer dans l'ordre |
| `supabase/tests` | tests SQL (pgTAP) |
| `tests` | tests de bout en bout Playwright |
| `docs/superpowers` | spécifications et plans de chaque évolution |

## Variables d'environnement

Voir [.env.example](.env.example). Les trois variables Supabase et `NEXT_PUBLIC_SITE_URL` sont nécessaires ; les alertes e-mail (Resend) et les statistiques Cloudflare restent inactives tant que leurs variables sont vides. Aucune clé ne doit être commitée : le dépôt est public.
