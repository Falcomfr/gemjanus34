import type { JSX } from "react";
import type { PlanningSlot as Slot } from "@/content/types";
import { fr } from "@/lib/text/french";
import { formatRange } from "./planning-format";

export function PlanningSlot({ slot }: { slot: Slot }): JSX.Element {
  return (
    <li className={`planning-slot planning-slot--${slot.family}`}>
      <span className="planning-slot__time">{formatRange(slot.startsAt, slot.endsAt)}</span>
      <strong className="planning-slot__title">{fr(slot.title)}</strong>
      {slot.leader ? <span className="planning-slot__leader">avec {slot.leader}</span> : null}
      {slot.note ? <span className="planning-slot__note">{fr(slot.note)}</span> : null}
    </li>
  );
}
