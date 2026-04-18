import { createFileRoute } from "@tanstack/react-router";
import { SpaceGame } from "@/components/game/SpaceGame";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "L'Aventure Spatiale — Attrape les étoiles, évite les astéroïdes !" },
      {
        name: "description",
        content:
          "Un mini-jeu d'arcade coloré et amusant pour les enfants. Pilote une fusée, collecte des étoiles et attrape les bonus arc-en-ciel et bouclier en évitant les astéroïdes.",
      },
      { property: "og:title", content: "L'Aventure Spatiale" },
      {
        property: "og:description",
        content: "Un jeu d'arcade coloré dans le navigateur — attrape les étoiles, évite les astéroïdes, prends les bonus !",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

function Index() {
  return <SpaceGame />;
}
