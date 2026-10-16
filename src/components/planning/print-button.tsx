"use client";

import { Printer } from "lucide-react";
import type { JSX } from "react";

export function PrintButton(): JSX.Element {
  return (
    <button className="button button--dark" type="button" onClick={() => window.print()}>
      <Printer aria-hidden="true" size={20} />
      Imprimer ou enregistrer en PDF
    </button>
  );
}
