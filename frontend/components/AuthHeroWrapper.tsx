"use client";

import React, { useState, useEffect } from "react";
import { HeroSection } from "./HeroSection";
import { API_BASE_URL, apiFetch } from "@/lib/config";

export default function AuthHeroWrapper() {
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

  if (isLoggedIn) return null;
  return <HeroSection />;
}
