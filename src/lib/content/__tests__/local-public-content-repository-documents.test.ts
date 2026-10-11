import { expect, test, vi } from "vitest";

const documentDate = vi.hoisted(() => ({ value: "2026-10-15" }));

vi.mock("@/content/seed", async (importOriginal) => {
  const seed = await importOriginal<typeof import("@/content/seed")>();

  return {
    ...seed,
    publicDocuments: [
      {
        id: "invalid-date-document",
        title: "Document avec date invalide",
        slug: "document-date-invalide",
        description: "Document de test",
        category: "planning",
        mimeType: "application/pdf",
        get updatedAt() {
          return documentDate.value;
        },
        downloadUrl: "/documents/document-date-invalide",
      },
    ],
  };
});

async function repositoryWithDocumentDate(updatedAt: string) {
  documentDate.value = updatedAt;
  vi.resetModules();
  return (await import("../local-public-content-repository")).publicContentRepository;
}

test.each([
  ["malformed", "2026/10/15"],
  ["impossible", "2026-02-30"],
  ["arbitrary", "October 15, 2026"],
  ["timezone-less", "2026-10-15T12:00:00"],
])("rejects a %s document updatedAt at every repository boundary", async (_, updatedAt) => {
  const repository = await repositoryWithDocumentDate(updatedAt);

  await expect(repository.getDocuments()).rejects.toThrow(`Invalid public date: ${updatedAt}`);
  await expect(repository.getSiteData()).rejects.toThrow(`Invalid public date: ${updatedAt}`);
});
