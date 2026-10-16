import { fireEvent, render, screen } from "@testing-library/react";
import { ClickToLoad } from "../click-to-load";

const props = {
  title: "TCC et troubles bipolaires",
  src: "https://www.youtube-nocookie.com/embed/5PN11L4wXKA?autoplay=1&rel=0",
  actionLabel: "Lire la vidéo",
  notice: "Vidéo hébergée par YouTube : la lancer charge leur service.",
  thumbnail: "https://i.ytimg.com/vi/5PN11L4wXKA/hqdefault.jpg",
  linkHref: "https://www.youtube.com/watch?v=5PN11L4wXKA",
  linkLabel: "Voir sur YouTube",
  variant: "video" as const,
};

test("loads nothing from the provider before the click", () => {
  const { container } = render(<ClickToLoad {...props} />);

  expect(container.querySelector("iframe")).toBeNull();
  expect(screen.getByText(props.notice)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /voir sur youtube/i })).toHaveAttribute("href", props.linkHref);
});

test("replaces the button with the player on click", () => {
  const { container } = render(<ClickToLoad {...props} />);

  fireEvent.click(screen.getByRole("button", { name: "Lire la vidéo : TCC et troubles bipolaires" }));

  const frame = container.querySelector("iframe")!;
  expect(frame).toHaveAttribute("src", props.src);
  expect(frame).toHaveAttribute("title", props.title);
  expect(frame).toHaveAttribute("allowfullscreen");
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(document.activeElement).toBe(frame);
});
