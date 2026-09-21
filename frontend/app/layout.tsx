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

export const metadata: Metadata = {
  metadataBase: new URL("https://akamdigital.vercel.app"),
  title: "AKAM Digital | Storytelling Platform",
  description: "Read, write, publish stories and manage editorial workflows.",
  openGraph: {
    title: "AKAM Digital | Storytelling Platform",
    description: "Read, write, publish stories and manage editorial workflows.",
    url: "https://akamdigital.vercel.app",
    siteName: "AKAM Digital",
    images: [
      {
        url: "https://akamdigital.vercel.app/images/ogImage/ogImage.png",
        width: 1200,
        height: 630,
        alt: "AKAM Digital",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AKAM Digital | Storytelling Platform",
    description: "Read, write, publish stories and manage editorial workflows.",
    images: ["https://akamdigital.vercel.app/images/ogImage/ogImage.png"],
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${openSans.variable} h-full antialiased`}
    >
      <body className="flex flex-col min-h-screen text-dark-bg font-poppins">
        <LayoutShell>{children}</LayoutShell>
        <Script src="/smoothScroll/smoothScroll.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
