import { beforeEach, expect, test, vi } from "vitest";

const getPage = vi.fn();
const getPublicContentRepository = vi.fn(() => ({ getPage }));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    cache: <Args extends unknown[], Result>(loader: (...args: Args) => Result) => {
      const values = new Map<string, Result>();
      return (...args: Args) => {
        const key = JSON.stringify(args);
        if (!values.has(key)) values.set(key, loader(...args));
        return values.get(key) as Result;
      };
    },
  };
});

vi.mock("../public-repository", () => ({ getPublicContentRepository }));

beforeEach(() => {
  getPage.mockReset();
  getPublicContentRepository.mockClear();
});

test("shares one repository query for repeated loads of the same slug", async () => {
  const page = { slug: "nouvelle-page", title: "Nouvelle page", introduction: "Résumé", sections: [] };
  getPage.mockResolvedValue(page);
  const { getPublicPage } = await import("../public-page-loader");

  await expect(Promise.all([
    getPublicPage("nouvelle-page"),
    getPublicPage("nouvelle-page"),
  ])).resolves.toEqual([page, page]);

  expect(getPublicContentRepository).toHaveBeenCalledOnce();
  expect(getPage).toHaveBeenCalledOnce();
  expect(getPage).toHaveBeenCalledWith("nouvelle-page");
});
