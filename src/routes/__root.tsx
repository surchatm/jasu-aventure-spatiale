import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Jasu Aventure Spatiale" },
      { name: "description", content: "Un jeu d'arcade coloré dans le navigateur — attrape les étoiles, évite les astéroïdes, prends les bonus !" },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Jasu Aventure Spatiale" },
      { property: "og:description", content: "Un jeu d'arcade coloré dans le navigateur — attrape les étoiles, évite les astéroïdes, prends les bonus !" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Jasu Aventure Spatiale" },
      { name: "twitter:description", content: "Un jeu d'arcade coloré dans le navigateur — attrape les étoiles, évite les astéroïdes, prends les bonus !" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b7f140eb-0db1-4038-88b6-df137508f6ab/id-preview-4fe5647e--d936caea-2ab6-4fd2-b248-2bb0c18dd267.lovable.app-1776500287588.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b7f140eb-0db1-4038-88b6-df137508f6ab/id-preview-4fe5647e--d936caea-2ab6-4fd2-b248-2bb0c18dd267.lovable.app-1776500287588.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
