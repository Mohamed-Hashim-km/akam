"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import MasikaHero from "@/components/MasikaHero";
import FeaturedArtist from "@/components/FeaturedArtist";
import PreviousEditions, { EditionItem } from "@/components/PreviousEditions";
import AboutDigitalEdition from "@/components/AboutDigitalEdition";
import SubscriptionGateModal from "@/components/SubscriptionGateModal";
import { API_BASE_URL, apiFetch, formatAssetUrl } from "@/lib/config";
import { useSubscription } from "@/lib/useSubscription";

const EditionFlipbook = dynamic(() => import("@/components/EditionFlipbook"), { ssr: false });

export default function MasikaPage() {
  const [latestEdition, setLatestEdition] = useState<EditionItem | null>(null);
  const [flipbookOpen, setFlipbookOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);

  const { isSubscribed, refreshSubscription } = useSubscription();

  const fetchLatest = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/editions?page=1&limit=1`);
      if (!res.ok) return null;
      const json = await res.json();
      if (json?.data?.[0]) {
        setLatestEdition(json.data[0]);
        return json.data[0] as EditionItem;
      }
    } catch (err) {
      console.error("[MasikaPage] Failed to fetch latest edition:", err);
    }
    return null;
  }, []);

  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  // When user becomes subscribed or logs in, reload the edition to obtain real pdfUrl
  useEffect(() => {
    if (isSubscribed) {
      fetchLatest();
    }
  }, [isSubscribed, fetchLatest]);

  const handleReadLatest = () => {
    if (!isSubscribed || !latestEdition?.pdfUrl) {
      setGateOpen(true);
      return;
    }
    setFlipbookOpen(true);
  };

  const handleSubscribed = async () => {
    await refreshSubscription();
    const updated = await fetchLatest();
    if (updated?.pdfUrl) {
      setFlipbookOpen(true);
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

      {/* Previous Editions — passes isSubscribed so cards can show lock icons */}
      <PreviousEditions isSubscribed={isSubscribed} />

      {/* Featured Artist Section */}
      <FeaturedArtist />

      {/* About Digital Edition & Pricing Section */}
      <AboutDigitalEdition />

      {/* Subscription Gate Modal (non-subscribers) */}
      <SubscriptionGateModal
        isOpen={gateOpen}
        onClose={() => setGateOpen(false)}
        onSubscribed={handleSubscribed}
        context="emagazine"
      />

      {/* Latest Edition Flipbook Modal (subscribers only) */}
      {flipbookOpen && latestEdition && latestEdition.pdfUrl && (
        <EditionFlipbook
          pdfUrl={latestEdition.pdfUrl}
          title={latestEdition.title}
          onClose={() => setFlipbookOpen(false)}
        />
      )}
    </div>
  );
}
