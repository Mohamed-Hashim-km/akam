"use client";

import React, { useState, useEffect } from "react";
import HeroSection from "@/components/HeroSection";
import LatestStories from "@/components/LatestStories";
import UpcomingEvents from "@/components/UpcomingEvents";
import UpcomingBookReleases from "@/components/UpcomingBookReleases";
import FeaturedVideo from "@/components/FeaturedVideo";
import ExploreByInterest from "@/components/ExploreByInterest";
import ReaderReviews from "@/components/ReaderReviews";
import EditorsNote from "@/components/EditorsNote";
import { API_BASE_URL, apiFetch } from "@/lib/config";

export default function Home() {
  // Synchronously initialize auth state from localStorage to eliminate initial render flash
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const cachedUser = localStorage.getItem("akam_user");
      return !!cachedUser;
    }
    return false;
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/users/me`);
        if (res.ok) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
          localStorage.removeItem("akam_user");
        }
      } catch (e) {
        setIsLoggedIn(false);
      }
    };
    checkAuth();

    const handleAuthUpdate = () => {
      const user = localStorage.getItem("akam_user");
      setIsLoggedIn(!!user);
    };
    window.addEventListener("akam_user_updated", handleAuthUpdate);
    return () => window.removeEventListener("akam_user_updated", handleAuthUpdate);
  }, []);

  return (
    <main className="min-h-screen flex flex-col font-poppins">
      {/* Main Hero Section - Only shown for unauthenticated / guest users (zero flash for logged-in users) */}
      {!isLoggedIn && <HeroSection />}

      {/* Latest Stories Section */}
      <LatestStories />

      {/* Editor's Note Section */}
      <EditorsNote />

      {/* Explore By Interest Section */}
      <ExploreByInterest />

      {/* Upcoming Events Section */}
      <UpcomingEvents />

      {/* Featured Video Section */}
      <FeaturedVideo />

      {/* Upcoming Book Releases Section */}
      <UpcomingBookReleases />

      {/* Reader Reviews Section */}
      <ReaderReviews />
    </main>
  );
}
