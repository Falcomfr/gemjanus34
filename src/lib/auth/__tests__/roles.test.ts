import { canManageContent, roleLabels } from "../roles";

test("administrators and managers manage live content, editors do not", () => {
  expect(canManageContent("admin")).toBe(true);
  expect(canManageContent("manager")).toBe(true);
  expect(canManageContent("editor")).toBe(false);
});

test("names each role in French", () => {
  expect(roleLabels).toEqual({ admin: "Administrateur", manager: "Gestionnaire", editor: "Éditeur" });
});
