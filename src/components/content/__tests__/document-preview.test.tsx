import { fireEvent, render, screen } from "@testing-library/react";
import { DocumentPreview } from "../document-preview";

function screenIsWide(wide: boolean) {
  window.matchMedia = ((query: string) => ({ matches: wide, media: query })) as unknown as typeof window.matchMedia;
}

function open(container: HTMLElement) {
  const details = container.querySelector("details")!;
  details.open = true;
  fireEvent(details, new Event("toggle"));
}

beforeEach(() => screenIsWide(true));

test("mounts the PDF only once the panel is opened", () => {
  const { container } = render(<DocumentPreview title="Statuts" url="/documents/statuts.pdf" />);

  expect(container.querySelector("iframe")).toBeNull();
  open(container);

  expect(container.querySelector("iframe")).toHaveAttribute("src", "/documents/statuts.pdf");
  expect(container.querySelector("iframe")).toHaveAttribute("title", "Statuts (PDF)");
});

test("offers to open the PDF in full and to download it", () => {
  render(<DocumentPreview title="Statuts" url="/documents/statuts.pdf" />);

  expect(screen.getByText("Afficher le document").closest("summary")).toHaveTextContent("Afficher le document Statuts");
  expect(screen.getByRole("link", { name: /ouvrir en grand statuts/i })).toHaveAttribute("target", "_blank");
  expect(screen.getByRole("link", { name: /ouvrir en grand/i })).toHaveAttribute("href", "/documents/statuts.pdf");
  expect(screen.getByRole("link", { name: "Télécharger Statuts (PDF)" })).toHaveAttribute("download");
});

test("asks the storage to download an uploaded PDF", () => {
  const url = "https://example.supabase.co/storage/v1/object/public/documents/planning/automne.pdf";
  render(<DocumentPreview title="Planning" url={url} />);

  expect(screen.getByRole("link", { name: "Télécharger Planning (PDF)" })).toHaveAttribute("href", `${url}?download=`);
});

test("never loads the PDF on a phone, where browsers cannot show it inline", () => {
  screenIsWide(false);
  const { container } = render(<DocumentPreview title="Statuts" url="/documents/statuts.pdf" />);

  open(container);

  expect(container.querySelector("iframe")).toBeNull();
  expect(screen.getByRole("link", { name: /ouvrir en grand/i })).toBeInTheDocument();
});

test("keeps an existing query string when asking for a download", () => {
  render(<DocumentPreview title="Planning" url="https://example.supabase.co/planning.pdf?v=2" />);

  expect(screen.getByRole("link", { name: "Télécharger Planning (PDF)" })).toHaveAttribute(
    "href",
    "https://example.supabase.co/planning.pdf?v=2&download=",
  );
});

test("counts the first opening of a document, not the closing", () => {
  const { container } = render(<DocumentPreview title="Statuts" url="/documents/statuts.pdf" />);
  const summary = container.querySelector("summary")!;

  expect(summary).toHaveAttribute("data-stat", "pdf");
  open(container);
  expect(summary).not.toHaveAttribute("data-stat");
});
