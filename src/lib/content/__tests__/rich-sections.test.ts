import { splitRichSections } from "../rich-sections";

const text = (value: string) => ({ type: "text" as const, text: value });
const heading = (level: 2 | 3, value: string) => ({ type: "heading" as const, attrs: { level }, content: [text(value)] });
const paragraph = (value: string) => ({ type: "paragraph" as const, content: [text(value)] });

test("splits a document into an introduction and sections at each H2", () => {
  const { intro, sections } = splitRichSections({
    type: "doc",
    content: [paragraph("Avant"), heading(2, "Les ateliers"), paragraph("Écriture"), heading(3, "Détail"), heading(2, "Horaires"), paragraph("13 h")],
  });

  expect(intro).toEqual([paragraph("Avant")]);
  expect(sections.map(({ id, title, blocks }) => [id, title, blocks.length])).toEqual([
    ["les-ateliers", "Les ateliers", 2],
    ["horaires", "Horaires", 1],
  ]);
});

test("gives repeated headings unique, stable ids", () => {
  const { sections } = splitRichSections({
    type: "doc",
    content: [heading(2, "Accueil"), heading(2, "Accueil-2"), heading(2, "Accueil"), heading(2, "")],
  });

  expect(sections.map((section) => section.id)).toEqual(["accueil", "accueil-2", "accueil-3", "section-4"]);
});
