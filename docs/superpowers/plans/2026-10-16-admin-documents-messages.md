# Documents, messages et finitions de l'admin - Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Construire les rubriques Documents et Messages, activer le formulaire de contact et corriger les défauts de l'admin.

**Architecture:** Deux migrations Supabase (tables, compartiment de stockage, RLS) testées en pgTAP ; actions serveur Next sur le modèle de `src/app/admin/actualites/actions.ts` ; le dépôt public lit les documents en base quand Supabase est configuré.

**Spec:** `docs/superpowers/specs/2026-10-16-admin-documents-messages.md`

## Global Constraints

- RLS : écriture réservée à `public.is_active_editor()` ; les visiteurs anonymes ne peuvent qu'insérer un message, jamais lire.
- PDF uniquement, 4 Mo au plus (limite Vercel 4,5 Mo) ; `experimental.serverActions.bodySizeLimit = "5mb"`.
- Aucun message « envoyé » affiché sans insertion réussie.
- Après chaque écriture : `revalidatePath` des pages publiques concernées.
- Pas de nouvelle dépendance.

## Review Focus

1. Mauvais mot de passe : l'e-mail reste dans le champ (test tâche 1).
2. Erreur de validation dans Pages ou Actualités : la saisie n'est pas perdue (test tâche 1).
3. Visiteur anonyme qui tente de lire `contact_messages` : refusé (pgTAP tâche 3).
4. Fichier non PDF ou trop lourd : refusé avec un message clair (test tâche 5).
5. Suppression du dernier planning : le site affiche le repli téléphone, pas une erreur (test tâche 4).

---

### Task 1: Les formulaires gardent la saisie
- Files: `src/app/admin/connexion/page.tsx`, `src/components/admin/page-form.tsx`, `src/components/admin/news-form.tsx` et leurs tests.
- Cause : React 19 réinitialise un `<form action={fn}>` après l'action ; les champs non contrôlés reviennent à leur `defaultValue`.
- Correctif : envoyer via `onSubmit` + `startTransition(() => formAction(new FormData(form)))`, ce qui n'active pas la réinitialisation automatique.
- Tests : après une action en erreur, `email` garde sa valeur ; un titre modifié reste affiché.

### Task 2: Migration documents
- `supabase/migrations/20261016150000_documents.sql` : table `public.documents` (id, title 1..160, description 1..300, category check in planning/institutional/health/activity, document_date date, url text, storage_path text null unique, created_by, created_at), RLS lecture publique, écriture éditeurs actifs ; compartiment `documents` public ; politiques `storage.objects` (insert/delete éditeurs actifs, bucket `documents`) ; insertion des dix PDF embarqués (created_by = premier administrateur s'il existe, sinon migration sans lignes).
- `supabase/tests/documents_test.sql` : lecture anonyme ok ; insertion anonyme refusée ; insertion éditeur ok ; suppression éditeur ok.

### Task 3: Migration messages
- `supabase/migrations/20261016151000_contact_messages.sql` : table `public.contact_messages` (id, name 2..100, email 3..254, subject 3..150, message 20..5000, created_at, handled_at, handled_by), RLS : insert anon/authenticated avec `handled_at is null`, select/update/delete éditeurs actifs.
- `supabase/tests/contact_messages_test.sql` : anon insère, anon ne lit pas, éditeur lit, marque traité, supprime.
- Régénérer `src/lib/database.types.ts` (`supabase gen types typescript --local`).

### Task 4: Documents publics depuis la base
- `createSupabasePublicContentRepository.getDocuments(category?)` lit `documents` (tri date décroissante) et mappe vers `PublicDocument` (`updatedAt` = `document_date`, `downloadUrl` = `url`, `mimeType` PDF).
- Tests : mappage, filtre par catégorie, erreur propagée.

### Task 5: Admin documents
- `src/lib/admin/document-input.ts` : `parseDocumentFormData(formData)` (titre, description, catégorie, date, fichier PDF ≤ 4 Mo, signature `%PDF`).
- `src/app/admin/documents/{page.tsx,actions.ts}` : liste, `uploadDocument`, `deleteDocument` (supprime l'objet de stockage s'il existe).
- Tests : validation (type, taille, champs), contrat des actions.

### Task 6: Formulaire de contact et messages
- `src/app/contact/actions.ts` : `sendContactMessage` (contactSchema, insertion anonyme).
- `ContactForm` actif avec état succès / erreur ; texte de confidentialité mis à jour.
- `src/app/admin/messages/{page.tsx,actions.ts}` : liste, `markMessageHandled`, `deleteMessage`.
- Tests : succès seulement après insertion, champ piège, erreur sans Supabase ; page admin.

### Task 7: Barre latérale et tableau de bord
- « Voir le site » (`/`), « Tableau de bord », accès rapides en liens avec compteurs (brouillons, actualités à venir, documents, nouveaux messages).
- Tests : chaque lien de l'admin pointe vers une route existante.

### Task 8: Vérification
- Suite complète, lint, typecheck, `supabase test db`, build, Playwright ; recette de l'agent QA traitée ; revue finale.
