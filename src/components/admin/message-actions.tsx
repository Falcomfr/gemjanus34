"use client";

import { Check, Trash2 } from "lucide-react";
import { useActionState } from "react";
import { deleteMessage, markMessageHandled, type MessageActionState } from "@/app/admin/messages/actions";

const initialState: MessageActionState = {};

export function MessageActions({ id, handled }: { id: string; handled: boolean }) {
  const [handleState, handleAction, handling] = useActionState(markMessageHandled, initialState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteMessage, initialState);
  const error = handleState.formError ?? deleteState.formError;

  return (
    <div className="admin-messages__actions">
      {handled ? null : (
        <form action={handleAction}>
          <input type="hidden" name="messageId" value={id} />
          <button className="button button--dark" type="submit" disabled={handling}>
            <Check aria-hidden="true" size={18} />
            Marquer comme traité
          </button>
        </form>
      )}
      <form
        action={deleteAction}
        onSubmit={(event) => {
          if (!window.confirm("Supprimer définitivement ce message ?")) event.preventDefault();
        }}
      >
        <input type="hidden" name="messageId" value={id} />
        <button className="button admin-button--quiet" type="submit" disabled={deleting}>
          <Trash2 aria-hidden="true" size={18} />
          Supprimer
        </button>
      </form>
      {error ? <p className="admin-field-error" role="alert">{error}</p> : null}
    </div>
  );
}
