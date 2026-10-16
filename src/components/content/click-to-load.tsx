"use client";

import { MapPin, Play } from "lucide-react";
import { useState, type JSX } from "react";

type ClickToLoadProps = {
  title: string;
  src: string;
  actionLabel: string;
  notice: string;
  thumbnail?: string;
  linkHref: string;
  linkLabel: string;
  variant: "video" | "map";
};

/** A third-party frame (video, map) that loads only once the visitor asks for it. */
export function ClickToLoad({ title, src, actionLabel, notice, thumbnail, linkHref, linkLabel, variant }: ClickToLoadProps): JSX.Element {
  const [loaded, setLoaded] = useState(false);
  const Icon = variant === "map" ? MapPin : Play;

  return (
    <figure className={`embed embed--${variant}`}>
      <div className="embed__frame">
        {loaded ? (
          <iframe src={src} title={title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
        ) : (
          <button type="button" className="embed__start" onClick={() => setLoaded(true)} aria-label={`${actionLabel} : ${title}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- remote thumbnail, no optimisation needed */}
            {thumbnail ? <img src={thumbnail} alt="" loading="lazy" /> : null}
            <span className="embed__action">
              <Icon aria-hidden="true" size={26} />
              {actionLabel}
            </span>
          </button>
        )}
      </div>
      <figcaption>
        <strong>{title}</strong>
        <span>{notice}</span>
        <a href={linkHref} target="_blank" rel="noopener noreferrer">
          {linkLabel}
          <span className="sr-only"> (nouvel onglet)</span>
        </a>
      </figcaption>
    </figure>
  );
}
