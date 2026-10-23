import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AKAM Digital - Malayalam Literature, Stories & Monthly Magazine",
    short_name: "AKAM Digital",
    description:
      "Read, write, publish stories, poetry, and cultural articles on AKAM Digital — Kerala's premier digital literary platform.",
    start_url: "/",
    // "browser" prevents Chrome/Safari from treating the site as an
    // installable PWA, which hides the "Apps on device" toggle in
    // the browser's site-info panel.
    display: "browser",
    background_color: "#ffffff",
    theme_color: "#18181b",
    icons: [
      {
        src: "/icon.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
