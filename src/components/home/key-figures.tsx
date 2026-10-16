import type { JSX } from "react";

const figures = [
  { value: "2006", label: "année de création de l'association" },
  { value: "Lundi → samedi", label: "ouverture du GEM à 13 h" },
  { value: "100 %", label: "d'adhérents au Conseil d'Administration" },
] as const;

export function KeyFigures(): JSX.Element {
  return (
    <section className="key-figures" aria-labelledby="key-figures-title">
      <div className="content-container">
        <h2 className="sr-only" id="key-figures-title">
          Janus34 en quelques repères
        </h2>
        <ul className="key-figures__list">
          {figures.map((figure) => (
            <li key={figure.value}>
              <strong>{figure.value}</strong>
              <span>{figure.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
