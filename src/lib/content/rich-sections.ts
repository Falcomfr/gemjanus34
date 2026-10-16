import type { RichBlock, RichContent, RichInline } from "./rich-content-schema";

export type RichSection = { id: string; title: string; blocks: RichBlock[] };

export function inlineText(content: RichInline[] | undefined): string {
  return (content ?? []).map((node) => (node.type === "text" ? node.text : " ")).join("");
}

function slug(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Each H2 opens a section of the editorial layout; blocks before the first H2 form the introduction.
export function splitRichSections(doc: RichContent): { intro: RichBlock[]; sections: RichSection[] } {
  const intro: RichBlock[] = [];
  const sections: RichSection[] = [];
  const used = new Set<string>();

  for (const block of doc.content) {
    if (block.type === "heading" && block.attrs.level === 2) {
      const title = inlineText(block.content);
      const base = slug(title) || `section-${sections.length + 1}`;
      let id = base;
      for (let suffix = 2; used.has(id); suffix += 1) id = `${base}-${suffix}`;
      used.add(id);
      sections.push({ id, title, blocks: [] });
    } else if (sections.length > 0) {
      sections.at(-1)!.blocks.push(block);
    } else {
      intro.push(block);
    }
  }

  return { intro, sections };
}
