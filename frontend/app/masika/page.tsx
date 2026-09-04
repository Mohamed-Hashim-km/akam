"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import MasikaHero from "@/components/MasikaHero";
import FeaturedArtist from "@/components/FeaturedArtist";
import PreviousEditions, { EditionItem } from "@/components/PreviousEditions";
import AboutDigitalEdition from "@/components/AboutDigitalEdition";
import { API_BASE_URL, formatAssetUrl } from "@/lib/config";

const EditionFlipbook = dynamic(() => import("@/components/EditionFlipbook"), { ssr: false });

export default function MasikaPage() {
  const [latestEdition, setLatestEdition] = useState<EditionItem | null>(null);
  const [flipbookOpen, setFlipbookOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchLatest = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/editions?page=1&limit=1`);
        if (!res.ok) return;
        const json = await res.json();
        if (isMounted && json?.data?.[0]) {
          setLatestEdition(json.data[0]);
        }
      } catch (err) {
        console.error("[MasikaPage] Failed to fetch latest edition:", err);
      }
    };
    fetchLatest();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleReadLatest = () => {
    if (latestEdition) {
      setFlipbookOpen(true);
    } else {
      const el = document.getElementById("latest-edition");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <div className="flex flex-col font-poppins bg-white">
      {/* Masika Hero Section */}
      <MasikaHero
        onReadLatest={handleReadLatest}
        latestEditionTitle={latestEdition?.title}
        imageSrc={latestEdition?.coverImage ? formatAssetUrl(latestEdition.coverImage) : undefined}
      />

      {/* Featured Artist Section */}
      <FeaturedArtist />

      {/* Previous Editions Section */}
      <PreviousEditions />

      {/* About Digital Edition & Pricing Section */}
      <AboutDigitalEdition />

      {/* Latest Edition Flipbook Modal */}
      {flipbookOpen && latestEdition && (
        <EditionFlipbook
          pdfUrl={latestEdition.pdfUrl}
          title={latestEdition.title}
          onClose={() => setFlipbookOpen(false)}
        />
      )}
    </div>
  );
}
