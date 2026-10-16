import { videoEmbed } from "../embeds";

const youtube = {
  provider: "YouTube",
  src: "https://www.youtube-nocookie.com/embed/DpGc_XzHXw4?autoplay=1&rel=0",
  thumbnail: "https://i.ytimg.com/vi/DpGc_XzHXw4/mqdefault.jpg",
};

test.each([
  "https://www.youtube.com/watch?v=DpGc_XzHXw4",
  "http://www.youtube.com/watch?v=DpGc_XzHXw4",
  "https://youtube.com/watch?v=DpGc_XzHXw4&t=42s&list=PL123",
  "https://m.youtube.com/watch?v=DpGc_XzHXw4",
  "https://youtu.be/DpGc_XzHXw4?si=abc",
  "https://www.youtube.com/shorts/DpGc_XzHXw4",
  "https://www.youtube.com/embed/DpGc_XzHXw4",
])("recognizes the YouTube link %s", (href) => {
  expect(videoEmbed(href)).toEqual(youtube);
});

test("recognizes a Vimeo video without a thumbnail", () => {
  expect(videoEmbed("https://vimeo.com/76979871")).toEqual({
    provider: "Vimeo",
    src: "https://player.vimeo.com/video/76979871?autoplay=1&dnt=1",
  });
});

test.each([
  "https://www.youtube.com/@santequebec",
  "https://www.youtube.com/playlist?list=PL123",
  "https://www.youtube.com/watch?v=trop-court",
  "https://vimeo.com/channels/staffpicks",
  "https://www.example.org/watch?v=DpGc_XzHXw4",
  "/documents/statuts.pdf",
  "pas une adresse",
])("leaves %s as a link", (href) => {
  expect(videoEmbed(href)).toBeNull();
});
