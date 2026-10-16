export type VideoEmbed = {
  provider: "YouTube" | "Vimeo";
  src: string;
  thumbnail?: string;
};

const youtubeId = /^[\w-]{11}$/;

function parse(href: string): URL | null {
  try {
    return new URL(href);
  } catch {
    return null;
  }
}

function findYoutubeId(url: URL): string | null {
  const host = url.hostname.replace(/^(www|m)\./, "");
  if (host === "youtu.be") return url.pathname.slice(1);
  if (host !== "youtube.com") return null;
  if (url.pathname === "/watch") return url.searchParams.get("v");
  return url.pathname.match(/^\/(?:shorts|embed)\/([^/]+)$/)?.[1] ?? null;
}

/** The player of a YouTube or Vimeo video link, or null for any other link. */
export function videoEmbed(href: string): VideoEmbed | null {
  const url = parse(href);
  if (!url || !/^https?:$/.test(url.protocol)) return null;

  const id = findYoutubeId(url);
  if (id && youtubeId.test(id)) {
    return {
      provider: "YouTube",
      src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
      thumbnail: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
    };
  }

  const vimeo = url.hostname.replace(/^www\./, "") === "vimeo.com" && url.pathname.match(/^\/(\d+)$/)?.[1];
  if (vimeo) {
    return { provider: "Vimeo", src: `https://player.vimeo.com/video/${vimeo}?autoplay=1&dnt=1` };
  }
  return null;
}
