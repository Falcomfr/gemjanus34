import { render, screen } from "@testing-library/react";
import { ContentPage } from "../content-page";

test("renders structured sections and document downloads", () => {
  render(
    <ContentPage
      page={{
        slug: "exemple",
        title: "Titre",
        introduction: "Introduction",
        sections: [{ id: "section", title: "Section", body: "Contenu" }],
      }}
      documents={[
        {
          id: "doc-1",
          title: "Statuts",
          slug: "statuts",
          description: "Statuts de l'association",
          category: "institutional",
          mimeType: "application/pdf",
          updatedAt: "2026-10-11",
          downloadUrl: "/documents/statuts",
        },
      ]}
    />,
  );
  expect(screen.getByRole("heading", { level: 1, name: "Titre" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 2, name: "Section" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /télécharger statuts/i })).toHaveAttribute(
    "href",
    "/documents/statuts",
  );
});

test("renders paragraphs, lists, links and leading content", () => {
  const { container } = render(
    <ContentPage
      page={{
        slug: "exemple",
        title: "Titre",
        introduction: "Introduction",
        sections: [
          {
            id: "ateliers",
            title: "Ateliers",
            body: "Premier paragraphe.\n\nSecond paragraphe.",
            items: ["Écriture", "Qi Gong"],
            links: [
              { label: "Voir le planning", href: "/actualites#planning" },
              { label: "Psycom", href: "https://www.psycom.org/" },
            ],
          },
          { id: "etapes", title: "Étapes", body: "", items: ["Appeler", "Venir"], ordered: true },
        ],
      }}
    >
      <p>Encadré en tête</p>
    </ContentPage>,
  );

  expect(screen.getByText("Premier paragraphe.").tagName).toBe("P");
  expect(screen.getByText("Second paragraphe.").tagName).toBe("P");
  expect(container.querySelector("ul")?.textContent).toContain("Qi Gong");
  expect(container.querySelector("ol")?.textContent).toBe("AppelerVenir");
  expect(screen.getByRole("link", { name: "Voir le planning" })).not.toHaveAttribute("target");
  expect(screen.getByRole("link", { name: /psycom/i })).toHaveAttribute("target", "_blank");
  expect(screen.getByRole("link", { name: /psycom/i })).toHaveAttribute("rel", "noopener noreferrer");
  expect(screen.getByText("Encadré en tête").compareDocumentPosition(screen.getByText("Premier paragraphe.")))
    .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  expect(container.querySelector("p:empty")).toBeNull();
});

test("keeps French punctuation attached to the previous word", () => {
  render(
    <ContentPage
      page={{
        slug: "exemple",
        title: "Une visite ?",
        introduction: "Intro",
        sections: [{ id: "a", title: "Comment venir ?", body: "Le GEM « Hors les murs » : en ville.", items: ["Appelez !"] }],
      }}
    />,
  );

  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Une visite ?");
  expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Comment venir ?");
  expect(screen.getByText(/Hors les murs/).textContent).toBe("Le GEM « Hors les murs » : en ville.");
  expect(screen.getByText(/Appelez/).textContent).toBe("Appelez !");
});

test("renders editor content as written: marks, links, H3, nested lists and block order", () => {
  const { container } = render(
    <ContentPage
      page={{
        slug: "exemple",
        title: "Titre",
        introduction: "Intro",
        sections: [],
        content: {
          type: "doc",
          content: [
            { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Section" }] },
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Gras", marks: [{ type: "bold" }] },
                { type: "text", text: " italique", marks: [{ type: "italic" }] },
                { type: "text", text: " souligné", marks: [{ type: "underline" }] },
                { type: "text", text: " vert", marks: [{ type: "textStyle", attrs: { color: "#185c4c" } }] },
                { type: "hardBreak" },
                { type: "text", text: "Psycom", marks: [{ type: "link", attrs: { href: "https://www.psycom.org/" } }] },
              ],
            },
            { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Sous-titre" }] },
            {
              type: "bulletList",
              content: [
                {
                  type: "listItem",
                  content: [
                    { type: "paragraph", content: [{ type: "text", text: "Parent" }] },
                    { type: "orderedList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Enfant" }] }] }] },
                  ],
                },
              ],
            },
            { type: "paragraph", content: [{ type: "text", text: "Après la liste" }] },
          ],
        },
      }}
    />,
  );

  expect(screen.getByRole("heading", { level: 2, name: "Section" })).toBeInTheDocument();
  expect(container.querySelector("strong")?.textContent).toBe("Gras");
  expect(container.querySelector("em")?.textContent).toBe(" italique");
  expect(container.querySelector("u")?.textContent).toBe(" souligné");
  expect(container.querySelector('span[style*="color"]')?.textContent).toBe(" vert");
  expect(container.querySelector("br")).not.toBeNull();
  expect(screen.getByRole("link", { name: /psycom/i })).toHaveAttribute("href", "https://www.psycom.org/");
  expect(screen.getByRole("heading", { level: 3, name: "Sous-titre" })).toBeInTheDocument();
  expect(container.querySelector("ul ol li")?.textContent).toBe("Enfant");
  const list = container.querySelector("ul")!;
  expect(list.compareDocumentPosition(screen.getByText("Après la liste"))).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
});

test("shows a header visual and an eyebrow chosen by the route", () => {
  render(
    <ContentPage
      page={{ slug: "exemple", title: "Titre", introduction: "Intro", sections: [] }}
      eyebrow="L'association"
      visual={{ src: "/images/janus-vatican.jpg", alt: "Buste de Janus", caption: "Domaine public", width: 604, height: 530 }}
    />,
  );

  expect(screen.getByText("L'association")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Buste de Janus" })).toBeInTheDocument();
});

test("turns a paragraph holding only a video link into a player, and keeps a link inside a sentence", () => {
  const link = (text: string) => ({ type: "text" as const, text, marks: [{ type: "link" as const, attrs: { href: "https://www.youtube.com/watch?v=5PN11L4wXKA" } }] });
  render(
    <ContentPage
      page={{
        slug: "exemple",
        title: "Titre",
        introduction: "Intro",
        sections: [],
        content: {
          type: "doc",
          content: [
            { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Vidéos" }] },
            { type: "paragraph", content: [link("TCC et troubles bipolaires")] },
            { type: "paragraph", content: [{ type: "text", text: "Voir aussi " }, link("cet entretien"), { type: "text", text: "." }] },
          ],
        },
      }}
    />,
  );

  expect(screen.getByRole("button", { name: "Lire la vidéo : TCC et troubles bipolaires" })).toBeInTheDocument();
  expect(screen.getByText(/hébergée par YouTube/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /cet entretien/ })).toHaveAttribute("href", "https://www.youtube.com/watch?v=5PN11L4wXKA");
  expect(screen.getAllByRole("button")).toHaveLength(1);
});

test("links to its sub-pages at the bottom of the page", () => {
  render(
    <ContentPage
      page={{
        slug: "prises-de-parole",
        title: "Prises de parole",
        introduction: "",
        sections: [],
        subPages: [{ slug: "ils-en-parlent", title: "Ils en parlent" }],
      }}
    />,
  );

  const region = screen.getByRole("region", { name: "Dans cette rubrique" });
  expect(region).toContainElement(screen.getByRole("link", { name: "Ils en parlent" }));
  expect(screen.getByRole("link", { name: "Ils en parlent" })).toHaveAttribute("href", "/ils-en-parlent");
});
