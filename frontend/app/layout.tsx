import type { Metadata } from "next";
import { Poppins, Open_Sans } from "next/font/google";
import LayoutShell from "@/components/LayoutShell";
import "./globals.css";
import Script from "next/script";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-open-sans",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://akamdigital.in";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AKAM Digital | Malayalam Literature, Stories, Essays & E-Magazine",
    template: "%s | AKAM Digital",
  },
  description:
    "AKAM Digital is Kerala's premier digital literary publication and storytelling community. Discover handpicked contemporary Malayalam serialized fiction, short stories, poetry, cultural essays, and monthly Akam Masika digital editions.",
  applicationName: "AKAM Digital",
  keywords: [
    "AKAM Digital",
    "Malayalam literature",
    "മലയാള സാഹിത്യം",
    "Malayalam stories",
    "മലയാള കഥകൾ",
    "Malayalam poetry",
    "കവിതകൾ",
    "Akam Masika",
    "അകം മാസിക",
    "E-Magazine",
    "serialized novels",
    "Malayalam authors",
    "Kairali Books",
    "Kerala culture",
    "literary journal",
    "digital publishing",
  ],
  authors: [{ name: "AKAM Digital Editorial Board", url: SITE_URL }],
  creator: "AKAM Digital",
  publisher: "AKAM Digital & Kairali Books",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "AKAM Digital | Malayalam Literature, Stories, Essays & E-Magazine",
    description:
      "Explore curated contemporary Malayalam serialized fiction, short stories, poetry, cultural essays, and monthly Akam Masika digital editions.",
    url: SITE_URL,
    siteName: "AKAM Digital",
    locale: "ml_IN",
    alternateLocale: ["en_US"],
    type: "website",
    images: [
      {
        url: "/images/ogImage/ogImage.png",
        width: 1200,
        height: 630,
        alt: "AKAM Digital - Contemporary Malayalam Literature Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AKAM Digital | Malayalam Literature, Stories, Essays & E-Magazine",
    description:
      "Explore curated contemporary Malayalam serialized fiction, short stories, poetry, cultural essays, and monthly Akam Masika digital editions.",
    images: ["/images/ogImage/ogImage.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "literature",
};

const jsonLdWebsite = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "AKAM Digital",
      description: "Kerala's premier digital literary publication and storytelling community.",
      inLanguage: ["ml", "en"],
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/works?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "AKAM Digital",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/images/akamdigital.png`,
      },
      sameAs: [
        "https://www.facebook.com/akamdigital",
        "https://www.instagram.com/akamdigital",
        "https://twitter.com/akamdigital",
      ],
      description:
        "Digital storytelling platform and monthly literary publication for contemporary Malayalam literature.",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ml"
      className={`${poppins.variable} ${openSans.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebsite) }}
        />
      </head>
      <body className="flex flex-col min-h-screen text-dark-bg font-poppins">
        <LayoutShell>{children}</LayoutShell>
        <Script
          src={
            process.env.NEXT_PUBLIC_PAYU_ENV === "PRODUCTION"
              ? "https://jssdk.payu.in/bolt/bolt.min.js"
              : "https://jssdk-uat.payu.in/bolt/bolt.min.js"
          }
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
