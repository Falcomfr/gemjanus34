# Planning modifiable - Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans.

**Goal:** Planning hebdomadaire en base, affiché joliment sur le site, imprimable en PDF, modifiable dans l'admin.

**Spec:** `docs/superpowers/specs/2026-10-16-planning-editable.md`

## Constraints

- Pas de nouvelle dépendance : export PDF par la page imprimable et `window.print()`.
- Données initiales identiques au PDF du 22/06/2026.
- RLS : lecture publique, écriture `public.is_active_editor()`.
- Sans Supabase, le planning embarqué (même contenu) est utilisé.

## Tasks

1. **Migration et pgTAP** : tables `planning_settings` (une ligne), `planning_days`, `planning_slots`, politiques, données du PDF. Tests : lecture anonyme, écriture refusée à l'anonyme, éditeur peut modifier, 11 créneaux importés.
2. **Modèle et dépôt** : type `Planning`, `getPlanning()` local (embarqué) et Supabase, tri par jour puis heure. Tests.
3. **Affichage public** : `WeekPlanning` (grille, jour courant, légende), `TodayAtGem` sur l'accueil, intégration à `/actualites#planning`. Tests de rendu.
4. **Version imprimable** : `/planning/imprimer`, styles `@media print` A4 paysage, bouton d'impression. Test + capture.
5. **Admin** : `/admin/planning`, actions `savePlanningSettings`, `savePlanningDay`, `savePlanningSlot`, `deletePlanningSlot` avec validation. Tests d'actions et de page, lien de navigation.
6. **Vérification** : suites, e2e (modifier un créneau puis le voir sur le site, page imprimable), captures 390/1440 et impression.
