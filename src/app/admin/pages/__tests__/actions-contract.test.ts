import * as pageActions from "../actions";

test("exports only async server actions at runtime", () => {
  for (const [name, exportedValue] of Object.entries(pageActions)) {
    expect(exportedValue, `${name} must be a server action`).toBeInstanceOf(Function);
    expect(exportedValue.constructor.name, `${name} must be async`).toBe("AsyncFunction");
  }
});
