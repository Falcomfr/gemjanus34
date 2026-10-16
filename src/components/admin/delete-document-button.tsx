"use client";

import { Trash2 } from "lucide-react";
import { useActionState } from "react";
import { deleteDocument, type DocumentActionState } from "@/app/admin/documents/actions";

const initialState: DocumentActionState = {};

export function DeleteDocumentButton({ id, title }: { id: string; title: string }) {
  const [state, formAction, pending] = useActionState(deleteDocument, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(`Supprimer « ${title} » du site ?`)) event.preventDefault();
      }}
    >
      <input type="hidden" name="documentId" value={id} />
      <button className="admin-icon-button" type="submit" disabled={pending} aria-label={`Supprimer ${title}`} title="Supprimer">
        <Trash2 aria-hidden="true" size={18} />
      </button>
      {state.formError ? <span className="admin-field-error" role="alert">{state.formError}</span> : null}
    </form>
  );
}
