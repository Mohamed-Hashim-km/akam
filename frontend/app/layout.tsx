import type { Metadata } from "next";
import { Poppins, Open_Sans } from "next/font/google";
import LayoutShell from "@/components/LayoutShell";
import "./globals.css";

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
  title: "AKAM Digital | Storytelling Platform",
  description: "Read, write, publish stories and manage editorial workflows.",
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
      </body>
    </html>
  );
}
