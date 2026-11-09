import { render, screen } from "@testing-library/react";
import { MembershipLink } from "../membership-link";

test("renders nothing without an address", () => {
  const { container } = render(<MembershipLink href={null} />);
  expect(container).toBeEmptyDOMElement();
});

test("opens the HelloAsso page in a new tab and says so", () => {
  render(<MembershipLink href="https://www.helloasso.com/associations/janus34" />);

  const link = screen.getByRole("link", { name: /adhérer ou faire un don/i });
  expect(link).toHaveAttribute("href", "https://www.helloasso.com/associations/janus34");
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noopener noreferrer");
  expect(link).toHaveAccessibleName(/nouvel onglet/);
});
