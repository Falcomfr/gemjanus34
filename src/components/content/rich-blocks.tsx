import type { JSX, ReactNode } from "react";
import type { RichBlock, RichInline } from "@/lib/content/rich-content-schema";
import { ClickToLoad } from "@/components/content/click-to-load";
import { videoEmbed } from "@/lib/content/embeds";
import { fr } from "@/lib/text/french";

/** The video of a paragraph that holds nothing but a link to it. */
function soleVideoLink(nodes: RichInline[]) {
  const [node] = nodes;
  if (nodes.length !== 1 || node.type !== "text") return null;
  const href = node.marks?.find((mark) => mark.type === "link")?.attrs.href;
  const video = href ? videoEmbed(href) : null;
  return href && video ? { href, text: node.text, video } : null;
}

function Inline({ nodes }: { nodes?: RichInline[] }): JSX.Element {
  return (
    <>
      {(nodes ?? []).map((node, index) => {
        if (node.type === "hardBreak") return <br key={index} />;
        let element: ReactNode = fr(node.text);
        for (const mark of node.marks ?? []) {
          if (mark.type === "bold") element = <strong>{element}</strong>;
          else if (mark.type === "italic") element = <em>{element}</em>;
          else if (mark.type === "underline") element = <u>{element}</u>;
          else if (mark.type === "textStyle") element = <span style={{ color: mark.attrs.color }}>{element}</span>;
          else if (mark.type === "link") {
            const external = /^https?:\/\//.test(mark.attrs.href);
            element = external ? (
              <a href={mark.attrs.href} target="_blank" rel="noopener noreferrer">
                {element}
                <span className="sr-only"> (nouvel onglet)</span>
              </a>
            ) : (
              <a href={mark.attrs.href}>{element}</a>
            );
          }
        }
        return <span key={index}>{element}</span>;
      })}
    </>
  );
}

export function RichBlocks({ blocks }: { blocks: RichBlock[] }): JSX.Element {
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "paragraph":
            if (!block.content?.length) return null;
            const link = soleVideoLink(block.content);
            return link ? (
              <ClickToLoad
                key={index}
                variant="video"
                title={fr(link.text)}
                src={link.video.src}
                thumbnail={link.video.thumbnail}
                actionLabel="Lire la vidéo"
                notice={fr(`Vidéo hébergée par ${link.video.provider} : la lancer charge leur service.`)}
                linkHref={link.href}
                linkLabel={`Voir sur ${link.video.provider}`}
              />
            ) : (
              <p key={index}><Inline nodes={block.content} /></p>
            );
          case "heading":
            return block.attrs.level === 2 ? (
              <h2 key={index}><Inline nodes={block.content} /></h2>
            ) : (
              <h3 key={index}><Inline nodes={block.content} /></h3>
            );
          case "bulletList":
            return (
              <ul className="content-list" key={index}>
                {block.content.map((item, itemIndex) => <li key={itemIndex}><RichBlocks blocks={item.content} /></li>)}
              </ul>
            );
          case "orderedList":
            return (
              <ol className="content-list content-list--steps" start={block.attrs?.start} key={index}>
                {block.content.map((item, itemIndex) => <li key={itemIndex}><RichBlocks blocks={item.content} /></li>)}
              </ol>
            );
        }
      })}
    </>
  );
}
