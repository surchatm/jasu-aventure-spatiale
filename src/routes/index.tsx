import { createFileRoute } from "@tanstack/react-router";
import { SpaceGame } from "@/components/game/SpaceGame";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Space Snack Adventure — Catch Stars, Dodge Asteroids!" },
      {
        name: "description",
        content:
          "A bright, fun mini arcade game for kids. Pilot a rocket, collect stars, and grab rainbow & shield power-ups while dodging asteroids.",
      },
      { property: "og:title", content: "Space Snack Adventure" },
      {
        property: "og:description",
        content: "A colorful browser arcade game — catch stars, dodge asteroids, grab power-ups!",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

function Index() {
  return <SpaceGame />;
}
