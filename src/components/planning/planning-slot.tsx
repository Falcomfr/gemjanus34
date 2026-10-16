"use client";

import { ArrowRight, Phone, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type JSX } from "react";
import { contact } from "@/content/contact";
import type { PlanningSlot as Slot } from "@/content/types";
import { fr } from "@/lib/text/french";
import { dayNames, familyDescriptions, familyLabels, formatRange } from "./planning-format";

function SlotSummary({ slot }: { slot: Slot }): JSX.Element {
  return (
    <>
      <span className="planning-slot__time">{formatRange(slot.startsAt, slot.endsAt)}</span>
      <strong className="planning-slot__title">{fr(slot.title)}</strong>
      {slot.leader ? <span className="planning-slot__leader">avec {slot.leader}</span> : null}
      {slot.note ? <span className="planning-slot__note">{fr(slot.note)}</span> : null}
    </>
  );
}

function SlotDialog({ slot, onClose }: { slot: Slot; onClose: () => void }): JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    // showModal gives focus trapping, Escape and the backdrop; fall back to a plain open dialog.
    if (element && !element.open) {
      if (typeof element.showModal === "function") element.showModal();
      else element.setAttribute("open", "");
    }
  }, []);

  return (
    <dialog
      ref={dialog}
      className={`slot-dialog planning-slot--${slot.family}`}
      aria-labelledby={`slot-dialog-${slot.id}`}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="slot-dialog__body">
        <button className="slot-dialog__close" type="button" onClick={onClose} aria-label="Fermer">
          <X aria-hidden="true" size={22} />
        </button>
        <p className="slot-dialog__family">{familyLabels[slot.family]}</p>
        <h3 id={`slot-dialog-${slot.id}`}>{fr(slot.title)}</h3>
        <p className="slot-dialog__when">
          {dayNames[slot.day]}, {formatRange(slot.startsAt, slot.endsAt)}
          {slot.leader ? <span> · avec {slot.leader}</span> : null}
        </p>
        {slot.note ? <p className="slot-dialog__note">{fr(slot.note)}</p> : null}
        {slot.description ? <p>{fr(slot.description)}</p> : null}
        <p className="slot-dialog__family-text">{fr(familyDescriptions[slot.family])}</p>
        <div className="slot-dialog__links">
          <Link className="text-link" href="/activites">
            Toutes les activités
            <ArrowRight aria-hidden="true" size={18} />
          </Link>
          <a className="text-link" href={contact.phoneHref}>
            <Phone aria-hidden="true" size={18} />
            Une question ? {contact.phone}
          </a>
        </div>
      </div>
    </dialog>
  );
}

export function PlanningSlot({ slot, interactive = true }: { slot: Slot; interactive?: boolean }): JSX.Element {
  const [open, setOpen] = useState(false);

  if (!interactive) {
    return (
      <li className={`planning-slot planning-slot--${slot.family}`}>
        <SlotSummary slot={slot} />
      </li>
    );
  }

  return (
    <li className={`planning-slot planning-slot--${slot.family} planning-slot--interactive`}>
      <button className="planning-slot__button" type="button" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <SlotSummary slot={slot} />
        <span className="sr-only"> (plus d’informations)</span>
      </button>
      {open ? <SlotDialog slot={slot} onClose={() => setOpen(false)} /> : null}
    </li>
  );
}
