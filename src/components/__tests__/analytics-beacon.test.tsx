import { render } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { AnalyticsBeacon } from "../analytics-beacon";

const pathname = vi.hoisted(() => ({ current: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));
vi.mock("next/script", () => ({ default: (props: Record<string, string>) => <script data-testid="beacon" {...props} /> }));

beforeEach(() => {
  pathname.current = "/";
});

test("loads nothing without a Cloudflare token", () => {
  const { container } = render(<AnalyticsBeacon token={undefined} />);
  expect(container.querySelector("script")).toBeNull();
});

test("counts public pages with the cookieless Cloudflare beacon", () => {
  const { container } = render(<AnalyticsBeacon token="abc123" />);
  const script = container.querySelector("script")!;

  expect(script.getAttribute("src")).toBe("https://static.cloudflareinsights.com/beacon.min.js");
  expect(JSON.parse(script.getAttribute("data-cf-beacon")!)).toEqual({ token: "abc123" });
});

test("does not count the administration", () => {
  pathname.current = "/admin/pages";
  const { container } = render(<AnalyticsBeacon token="abc123" />);
  expect(container.querySelector("script")).toBeNull();
});
