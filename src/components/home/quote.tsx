import type { JSX } from "react";

export function Quote(): JSX.Element {
  return (
    <section className="quote-band" aria-label="Les objectifs de Janus34">
      <figure className="content-container quote-band__inner">
        <blockquote>
          <p>Rompre les solitudes, favoriser l&apos;entraide, la solidarité et le partage entre les membres.</p>
        </blockquote>
        <figcaption>Les objectifs de l&apos;association Janus34</figcaption>
      </figure>
    </section>
  );
}
