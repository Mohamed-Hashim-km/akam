import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AKAM Digital",
    short_name: "AKAM",
    description: "Read, write, publish stories and manage editorial workflows.",
    start_url: "/",
    // "browser" prevents Chrome/Safari from treating the site as an
    // installable PWA, which hides the "Apps on device" toggle in
    // the browser's site-info panel.
    display: "browser",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/icon.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
