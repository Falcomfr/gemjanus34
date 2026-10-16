import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { DocumentUploadForm } from "../document-upload-form";

const uploadDocument = vi.hoisted(() => vi.fn());
vi.mock("@/app/admin/documents/actions", () => ({ uploadDocument }));

test("refuses a PDF over 4 MB before sending it", () => {
  const { container } = render(<DocumentUploadForm />);
  const big = new File([new Uint8Array(5 * 1024 * 1024)], "planning.pdf", { type: "application/pdf" });
  fireEvent.change(screen.getByLabelText(/fichier pdf/i), { target: { files: [big] } });

  fireEvent.submit(container.querySelector("form")!);

  expect(uploadDocument).not.toHaveBeenCalled();
  expect(screen.getByText("Le fichier dépasse 4 Mo.")).toBeInTheDocument();
});
