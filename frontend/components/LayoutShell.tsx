"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEditorialDashboard = pathname === "/editorial" || pathname?.startsWith("/editorial/");

  if (isEditorialDashboard) {
    return <div className="h-screen w-full flex flex-col bg-gray-50 overflow-hidden">{children}</div>;
  }

  return (
    <>
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </>
  );
}
