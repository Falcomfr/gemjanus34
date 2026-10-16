"use client";

import { ArrowRight, Phone, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type JSX } from "react";
import { contact } from "@/content/contact";
import { dayDateLabel, recurrenceLabel, type PlanningWeekSlot as Slot } from "@/lib/planning/week";
import { fr } from "@/lib/text/french";
import { dayNames, familyDescriptions, familyLabels, formatRange } from "./planning-format";

const slotClass = (slot: Slot) =>
  `planning-slot planning-slot--${slot.family}${slot.status === "normal" ? "" : ` planning-slot--${slot.status}`}`;

function SlotSummary({ slot }: { slot: Slot }): JSX.Element {
  return (
    <>
      {slot.status === "cancelled" ? <span className="planning-slot__badge">Annulé</span> : null}
      {slot.status === "extra" ? <span className="planning-slot__badge planning-slot__badge--extra">Exceptionnel</span> : null}
      <span className="planning-slot__time">{formatRange(slot.startsAt, slot.endsAt)}</span>
      <strong className="planning-slot__title">{fr(slot.title)}</strong>
      {slot.leader ? <span className="planning-slot__leader">avec {slot.leader}</span> : null}
      {slot.status === "cancelled" && slot.reason ? <span className="planning-slot__note">{fr(slot.reason)}</span> : null}
      {slot.status !== "cancelled" && slot.note ? <span className="planning-slot__note">{fr(slot.note)}</span> : null}
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
      // One slot may appear on several dates (week and today views): the id alone is not unique.
      aria-labelledby={`slot-dialog-${slot.id}-${slot.date}`}
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
        <h3 id={`slot-dialog-${slot.id}-${slot.date}`}>{fr(slot.title)}</h3>
        <p className="slot-dialog__when">
          {dayNames[slot.day]} {dayDateLabel(slot.date)}, {formatRange(slot.startsAt, slot.endsAt)}
          {slot.leader ? <span> · avec {slot.leader}</span> : null}
        </p>
        {slot.status === "cancelled" ? (
          <p className="slot-dialog__cancelled">
            {fr(`Annulé le ${dayNames[slot.day].toLowerCase()} ${dayDateLabel(slot.date)}${slot.reason ? ` : ${slot.reason}` : ""}.`)}
          </p>
        ) : null}
        {slot.status === "extra" ? <p className="slot-dialog__note">Séance exceptionnelle</p> : null}
        {recurrenceLabel(slot) ? <p className="slot-dialog__note">{recurrenceLabel(slot)}</p> : null}
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
      <li className={slotClass(slot)}>
        <SlotSummary slot={slot} />
      </li>
    );
  }

  return (
    <li className={`${slotClass(slot)} planning-slot--interactive`}>
      <button className="planning-slot__button" type="button" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <SlotSummary slot={slot} />
        <span className="sr-only"> (plus d’informations)</span>
      </button>
      {open ? <SlotDialog slot={slot} onClose={() => setOpen(false)} /> : null}
    </li>
  );
}
