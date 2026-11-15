import { render } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { eventForClick, SiteEventTracker } from "../site-event-tracker";

const link = (href: string) => {
  const a = document.createElement("a");
  a.href = href;
  a.innerHTML = "<span>texte</span>";
  return a;
};

test("names the gesture behind a click", () => {
  expect(eventForClick(link("tel:+33467048768").firstElementChild!)).toBe("phone");
  expect(eventForClick(link("https://www.google.com/maps/search/?api=1&query=x"))).toBe("map");
  expect(eventForClick(link("https://www.helloasso.com/associations/janus34"))).toBe("helloasso");
  expect(eventForClick(link("/documents/statuts.pdf"))).toBe("pdf");
  expect(eventForClick(link("https://x.supabase.co/storage/v1/object/public/documents/a.pdf?download="))).toBe("pdf");
  expect(eventForClick(link("/contact"))).toBeNull();

  const button = document.createElement("button");
  button.dataset.stat = "map";
  expect(eventForClick(button)).toBe("map");
  button.dataset.stat = "other";
  expect(eventForClick(button)).toBeNull();
});

const sendBeacon = vi.fn(() => true);
beforeEach(() => {
  Object.defineProperty(navigator, "sendBeacon", { value: sendBeacon, configurable: true });
  sendBeacon.mockClear();
});
afterEach(() => window.history.replaceState(null, "", "/"));

test("sends the gesture of a public page, never one of the admin", () => {
  render(<SiteEventTracker />);
  const phone = document.body.appendChild(link("tel:+33467048768"));
  phone.addEventListener("click", (event) => event.preventDefault());

  phone.click();
  expect(sendBeacon).toHaveBeenCalledWith("/api/stat", "phone");

  window.history.replaceState(null, "", "/admin/messages");
  phone.click();
  expect(sendBeacon).toHaveBeenCalledTimes(1);
});
