import { fireEvent, render, screen } from "@testing-library/react";
import { DocumentPreview } from "../document-preview";

test("mounts the PDF only once the panel is opened", () => {
  const { container } = render(<DocumentPreview title="Statuts" url="/documents/statuts.pdf" />);
  const details = container.querySelector("details")!;

  expect(container.querySelector("iframe")).toBeNull();
  details.open = true;
  fireEvent(details, new Event("toggle"));

  expect(container.querySelector("iframe")).toHaveAttribute("src", "/documents/statuts.pdf");
  expect(container.querySelector("iframe")).toHaveAttribute("title", "Statuts (PDF)");
});

test("offers to open the PDF in full and to download it", () => {
  render(<DocumentPreview title="Statuts" url="/documents/statuts.pdf" />);

  expect(screen.getByRole("link", { name: /ouvrir en grand/i })).toHaveAttribute("target", "_blank");
  expect(screen.getByRole("link", { name: /ouvrir en grand/i })).toHaveAttribute("href", "/documents/statuts.pdf");
  expect(screen.getByRole("link", { name: "Télécharger Statuts (PDF)" })).toHaveAttribute("download");
});

test("asks the storage to download an uploaded PDF", () => {
  const url = "https://example.supabase.co/storage/v1/object/public/documents/planning/automne.pdf";
  render(<DocumentPreview title="Planning" url={url} />);

  expect(screen.getByRole("link", { name: "Télécharger Planning (PDF)" })).toHaveAttribute("href", `${url}?download=`);
});
