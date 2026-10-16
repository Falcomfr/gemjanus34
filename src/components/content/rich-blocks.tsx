import type { JSX, ReactNode } from "react";
import type { RichBlock, RichInline } from "@/lib/content/rich-content-schema";
import { fr } from "@/lib/text/french";

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
            return block.content?.length ? <p key={index}><Inline nodes={block.content} /></p> : null;
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
