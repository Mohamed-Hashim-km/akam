"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";

const Pdf3DFlipbook = dynamic(() => import("@/components/Pdf3DFlipbook"), {
  ssr: false,
});

export default function FlipbookDemoPage() {
  const [pdfUrl, setPdfUrl] = useState<string>(
    "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf"
  );
  const [isOpen, setIsOpen] = useState<boolean>(true);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-6">
      {!isOpen ? (
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-2xl font-bold text-stone-200 tracking-wide">3D Flipbook Demo</h1>
          <button
            onClick={() => setIsOpen(true)}
            className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition-all shadow-lg hover:scale-105 cursor-pointer"
          >
            Open 3D Flipbook
          </button>
        </div>
      ) : (
        <Pdf3DFlipbook pdfUrl={pdfUrl} onClose={() => setIsOpen(false)} />
      )}
    </div>
  );
}
